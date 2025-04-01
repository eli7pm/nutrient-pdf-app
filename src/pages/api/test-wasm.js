// pages/api/convert.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads with size limit
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Disable Next.js body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to run middleware
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

// Helper function to check if WASM file exists
function checkWasmFile() {
  const baseDir = process.cwd();
  
  // Get a list of all possible paths to check
  const possiblePaths = [
    path.join(baseDir, 'node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm'),
    path.join(baseDir, '.next/server/chunks/nutrient-viewer.wasm'),
    '/var/task/node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm',
    // Try looking in other potential locations
    path.join(baseDir, 'node_modules/.pnpm/@nutrient-sdk+node@1.0.0/node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm')
  ];
  
  // Check each path
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return { exists: true, path: p };
      }
    } catch (err) {
      console.error(`Error checking path ${p}:`, err);
    }
  }
  
  return { exists: false, checkedPaths: possiblePaths };
}

export default async function handler(req, res) {
  console.time('total-conversion-time');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.time('file-upload');
    // Run multer middleware
    await runMiddleware(req, res, upload.single('file'));
    console.timeEnd('file-upload');

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    console.log(`File size: ${req.file.size} bytes`);
    
    // Check if WASM file exists before loading the SDK
    const wasmCheck = checkWasmFile();
    if (!wasmCheck.exists) {
      return res.status(500).json({
        error: 'WASM file not found',
        details: 'Nutrient SDK WASM file could not be located',
        checkedPaths: wasmCheck.checkedPaths
      });
    }
    
    console.log('WASM file found at:', wasmCheck.path);

    // Load the Nutrient SDK using dynamic import to reduce cold start time
    console.time('sdk-loading');
    let nutrientSDK;
    try {
      nutrientSDK = await import('@nutrient-sdk/node');
    } catch (err) {
      console.error('Error importing Nutrient SDK:', err);
      return res.status(500).json({
        error: 'Failed to import Nutrient SDK',
        details: err.message
      });
    }
    
    const { load } = nutrientSDK;
    console.timeEnd('sdk-loading');

    console.log('Successfully loaded @nutrient-sdk/node');

    // Use the SDK
    console.time('instance-creation');
    let instance;
    try {
      instance = await load({
        document: req.file.buffer,
        // Add minimal options
      });
    } catch (err) {
      console.error('Error creating Nutrient instance:', err);
      return res.status(500).json({
        error: 'Failed to initialize Nutrient SDK',
        details: err.message
      });
    }
    console.timeEnd('instance-creation');

    console.log('SDK loaded, exporting to PDF...');

    // Export to PDF
    console.time('pdf-export');
    let pdfBuffer;
    try {
      pdfBuffer = await instance.exportPDF();
    } catch (err) {
      console.error('Error exporting PDF:', err);
      // Make sure to close the instance even if export fails
      try { await instance.close(); } catch (e) { /* ignore */ }
      
      return res.status(500).json({
        error: 'Failed to export PDF',
        details: err.message
      });
    }
    console.timeEnd('pdf-export');
    
    // Close the instance
    console.time('instance-closing');
    await instance.close();
    console.timeEnd('instance-closing');
    
    // Return the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.send(Buffer.from(pdfBuffer));
    
    console.timeEnd('total-conversion-time');
  } catch (error) {
    console.error('Conversion error:', error);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      return res.status(500).json({ 
        error: 'Could not load Nutrient SDK',
        details: 'Module resolution failed: ' + error.message
      });
    }
    
    if (error.code === 'ENOENT' && error.path && error.path.includes('.wasm')) {
      return res.status(500).json({ 
        error: 'WASM file not found',
        details: `Missing file: ${error.path}`,
        path: error.path
      });
    }
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        details: 'Maximum file size is 10MB'
      });
    }
    
    return res.status(500).json({ 
      error: 'Conversion failed',
      details: error.message
    });
  }
}