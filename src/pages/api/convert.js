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
    runtime: 'edge',
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
  console.log('Starting PDF conversion request');
  console.time('total-conversion-time');
  
  if (req.method !== 'POST') {
    console.log(`Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    console.time('file-upload');
    console.log('Processing file upload with multer');
    await runMiddleware(req, res, upload.single('file'));
    console.timeEnd('file-upload');

    if (!req.file) {
      console.log('No file was provided in the request');
      return res.status(400).json({ error: 'No file provided' });
    }

    // Log file information
    console.log(`File received: ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}`);
    
    // Load the Nutrient SDK directly using require
    console.time('sdk-loading');
    console.log('Loading @nutrient-sdk/node module');
    const { load } = require('@nutrient-sdk/node');
    console.timeEnd('sdk-loading');

    console.log('Successfully loaded @nutrient-sdk/node');

    // Use the SDK - just create with standard options
    // Nutrient (PSPDFKit) will automatically log internal debug messages
    console.time('instance-creation');
    console.log('Creating Nutrient SDK instance');
    const instance = await load({
      document: req.file.buffer,
      // Only use standard options that are known to exist
    });
    console.timeEnd('instance-creation');
    console.log('Nutrient SDK instance created successfully');

    // Set up progress logging for export
    console.time('pdf-export');
    console.log('Starting PDF export process');
    
    // Setup periodic progress logging
    const startTime = Date.now();
    const exportInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      console.log(`PDF export in progress... (${elapsed.toFixed(1)}s elapsed)`);
      
      // Print memory usage
      try {
        const mem = process.memoryUsage();
        console.log(`Memory: RSS ${Math.round(mem.rss / 1024 / 1024)}MB, Heap ${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
      } catch (memErr) {
        console.log(`Could not get memory usage: ${memErr.message}`);
      }
    }, 5000); // Log every 5 seconds
    
    // Export to PDF
    let pdfBuffer;
    try {
      console.log('Calling instance.exportPDF()');
      pdfBuffer = await instance.exportPDF();
      clearInterval(exportInterval);
      console.log(`PDF export completed, size: ${pdfBuffer.byteLength} bytes`);
    } catch (exportError) {
      clearInterval(exportInterval);
      console.log('Export PDF call failed with error:', exportError);
      throw exportError;
    }
    console.timeEnd('pdf-export');

    // Close the instance
    console.time('instance-closing');
    console.log('Closing Nutrient SDK instance');
    await instance.close();
    console.timeEnd('instance-closing');
    console.log('Nutrient SDK instance closed successfully');

    // Return the PDF
    console.log('Sending PDF response to client');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.send(Buffer.from(pdfBuffer));
    
    console.timeEnd('total-conversion-time');
    console.log('PDF conversion completed successfully');
  } catch (error) {
    console.error('Conversion error:', error);
    console.error('Error stack:', error.stack);

    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`Module not found error: ${error.message}`);
      return res.status(500).json({
        error: 'Could not load Nutrient SDK',
        details: 'Module resolution failed: ' + error.message
      });
    }

    if (error.code === 'ENOENT' && error.path && error.path.includes('.wasm')) {
      console.error(`WASM file not found: ${error.path}`);
      return res.status(500).json({
        error: 'WASM file not found',
        details: `Missing file: ${error.path}`
      });
    }
    
    // Log any additional error properties that might help debugging
    console.error('Error type:', error.constructor.name);
    if (error.name) console.error('Error name:', error.name);
    if (error.cause) console.error('Error cause:', error.cause);
    
    // Check for timeout indicators in error
    if (error.message && (
        error.message.includes('timeout') || 
        error.message.includes('timed out') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('execution time')
    )) {
      console.error('DETECTED TIMEOUT ERROR in error message');
    }

    return res.status(500).json({
      error: 'Conversion failed',
      details: error.message
    });
  }
}