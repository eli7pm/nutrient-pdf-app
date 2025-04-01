// pages/api/convert.js
import multer from 'multer';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Disable Next.js body parser
export const config = {
  api: {
    bodyParser: false
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
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('file'));

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`File received: ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}`);

    // Generate a unique ID for this conversion
    const conversionId = nanoid();
    const originalFilename = req.file.originalname || 'document';
    const pdfFilename = originalFilename.replace(/\.[^/.]+$/, '') + '.pdf';

    // Load the Nutrient SDK directly using require
    console.log('Loading @nutrient-sdk/node module');
    const { load } = require('@nutrient-sdk/node');
    console.log('Successfully loaded @nutrient-sdk/node');

    // Use the SDK
    console.log('Creating Nutrient SDK instance');
    const instance = await load({
      document: req.file.buffer,
      license: {
        key: process.env.LICENSE_KEY,
        appName: process.env.APP_NAME
      }
    });
    console.log('Nutrient SDK instance created successfully');

    // Export to PDF
    console.log('Starting PDF export process');
    const pdfBuffer = await instance.exportPDF();
    console.log(`PDF export completed, size: ${pdfBuffer.byteLength} bytes`);

    // Close the instance
    console.log('Closing Nutrient SDK instance');
    await instance.close();
    console.log('Nutrient SDK instance closed successfully');

    // Upload the PDF to Vercel Blob Storage
    console.log('Uploading PDF to Blob Storage');
    const blob = await put(`converted-${conversionId}-${pdfFilename}`, Buffer.from(pdfBuffer), {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });
    console.log(`PDF uploaded to Blob Storage: ${blob.url}`);

    // Decide how to return the result to the client
    const directDownload = req.query.direct === 'true';

    if (directDownload) {
      // Option 1: Redirect the client directly to the blob URL
      // This is useful if the client supports redirects
      res.redirect(307, blob.url);
    } else {
      // Option 2: Return the blob URL as JSON
      // Client will need to make a second request to download
      res.status(200).json({
        success: true,
        url: blob.url,
        filename: pdfFilename,
        size: pdfBuffer.byteLength
      });
    }
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