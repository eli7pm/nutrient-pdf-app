// pages/api/convert.js
import multer from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('file'));

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Load the Nutrient SDK directly using require
    // This relies on Node.js to handle the module resolution
    const { load } = require('@nutrient-sdk/node');

    console.log('Successfully loaded @nutrient-sdk/node');

    // Use the SDK
    const instance = await load({
      document: req.file.buffer,
      // license config if available
    });

    // Export to PDF
    const pdfBuffer = await instance.exportPDF();
    
    // Close the instance
    await instance.close();
    
    // Return the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.send(Buffer.from(pdfBuffer));
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
        details: `Missing file: ${error.path}`
      });
    }
    
    return res.status(500).json({ 
      error: 'Conversion failed',
      details: error.message
    });
  }
}