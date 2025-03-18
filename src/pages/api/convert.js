// pages/api/convert.js
import multer from 'multer';
import { load } from '@nutrient-sdk/node';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to handle multer middleware
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

export default async function handler(req, res) {
  console.log('API route called with method:', req.method);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log environment info
    console.log('Node.js version:', process.version);
    console.log('Current directory:', process.cwd());
    
    // Run the multer middleware
    await runMiddleware(req, res, upload.single('file'));

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    console.log(`Processing file: ${file.originalname}, size: ${file.size} bytes`);

    try {
      // Load the document with Nutrient SDK
      console.log('Loading document...');
      const instance = await load({
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
      
      // Check for WASM file errors
      if (error.code === 'ENOENT' && error.path) {
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
}