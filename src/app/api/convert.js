// api/convert.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to handle multer middleware in serverless functions
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

module.exports = async (req, res) => {
  console.log('API endpoint called with method:', req.method);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log environment information
    console.log('Node.js version:', process.version);
    console.log('Current directory:', process.cwd());
    console.log('Environment:', process.env.NODE_ENV);
    
    try {
      // Check for Nutrient SDK files
      const modulePath = path.resolve('node_modules/@nutrient-sdk/node');
      console.log('Checking module path:', modulePath);
      
      if (fs.existsSync(modulePath)) {
        console.log('Nutrient SDK module directory exists');
        
        // Check vendor directory
        const vendorPath = path.join(modulePath, 'vendor');
        if (fs.existsSync(vendorPath)) {
          console.log('Vendor directory exists:', vendorPath);
          const vendorFiles = fs.readdirSync(vendorPath);
          console.log('Vendor files:', vendorFiles);
        } else {
          console.log('Vendor directory does not exist:', vendorPath);
        }
      } else {
        console.log('Nutrient SDK module directory does not exist');
      }
    } catch (err) {
      console.error('Error checking module files:', err);
    }

    // Run the multer middleware
    await runMiddleware(req, res, upload.single('file'));

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    console.log(`Processing file: ${file.originalname}, size: ${file.size} bytes`);

    try {
      // Dynamically import Nutrient SDK to avoid loading issues
      console.log('Importing Nutrient SDK...');
      const nutrient = require('@nutrient-sdk/node');
      console.log('Nutrient SDK imported successfully');
      
      // Load the document with Nutrient SDK
      console.log('Loading document...');
      const instance = await nutrient.load({
        document: file.buffer,
        // Add license if available
        // license: {
        //   key: process.env.NUTRIENT_LICENSE_KEY,
        //   appName: process.env.NUTRIENT_APP_NAME
        // }
      });
      console.log('Document loaded successfully');

      // Export to PDF
      console.log('Exporting to PDF...');
      const pdfBuffer = await instance.exportPDF();
      console.log('PDF exported successfully');

      // Close the instance
      await instance.close();
      console.log('Instance closed');

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="converted.pdf"`);

      // Send the PDF data
      console.log('Sending PDF response');
      return res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Nutrient SDK error:', error);

      // Check for specific errors
      if (error.code === 'ENOENT' && error.path && error.path.includes('.wasm')) {
        console.error('WASM file not found:', error.path);
        
        // Try to find other WASM files
        try {
          const baseDir = path.dirname(error.path);
          console.log('Checking directory:', baseDir);
          
          if (fs.existsSync(baseDir)) {
            const files = fs.readdirSync(baseDir);
            console.log('Files in directory:', files);
          } else {
            console.log('Directory does not exist:', baseDir);
          }
        } catch (dirError) {
          console.error('Error checking directory:', dirError);
        }
        
        return res.status(500).json({
          error: 'WASM file not found',
          details: `Missing file: ${error.path}`,
          path: error.path
        });
      }

      return res.status(500).json({
        error: 'Conversion failed',
        details: error.message || 'Unknown error during document conversion'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error',
      details: error.message || 'An unexpected server error occurred'
    });
  }
};