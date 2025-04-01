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
        key: "iXvwvRy11QRAq-elS6ON1sEEK4LNk5ZXMwzgfW-47ZDcLUV4LiyJJKZxfQ6xlVJlWOV1PpIZV9HrjIOcVdBKtB9hA1Y5-lnMnK1l7f3v49hTiUm7rjNSCaFw4fbwjr8Vt3RIDyGPg7oPCYHH9m_VFv512HcIXbc97Os2YhSCsM3AW46ghM__6MyVkZZMPJ47zqPulC7Gkx9y5IXfnAFYGyRRdPXyvl5ZyfXP1R_t0i7rqqONZ92ZWjf_VlXipxi5bcqnh7q-tZ02hENQgfnVODyPqBJbgndPqpJKUS1cu2e31JSuKAhDM94CfQSXit4DUYkBQTnGH9LN5QmSTO4sxpcq0qUAma32pwF0uUuknmh60S92_ga7jzna2hxk_3o8J-9lL_4-Ng12OgAC6LNQi0Y13Y1NwrjJRKs3S6t5UKylhOWhMavLXcXTTR331zYLrqFsbok_UijNaKAqJeorgatttSe4Jsl68jYhz4Pm02ifUu3IRlNcw9ZL2WfG3EgjoW2DS96ITdnFwLbsq4FtRSjoS5y7TTp4DFsXi1Jv-D2H-rzVHV1u_FXHjolCXhIr0LXG-uFoSp9ou_rI54WtnYkkgH5yn35kTPLU4Rq1qb9bNOe5aGoQwmeNKjp4sIx9mJVmFU1BSYwEvX_of-plETj9pmwmUZAQVxSou6F56ughZ2djVwPS_L7POms65ILoO7ZdUc0CMl9NSQfRyqaTai91_L9GwRCGPREHw9OmcpMMYhk0bEdrixXm2W57EwoGDmg7eoD3JHIgxchpOv7I0u424R1a_-IwSjayUHKDMTLf8cjDhYKAxYRJzIAW1P2G6Jual5N-vKedLAkrO2ixvLYFbc0WixfDEzMEkoBgN7fBAYNVmUtVhlLjozn08ICp_mc4fYBI9YhA_KHDFtSSkruf52FJ5ae0VlpzRr-HBjFNcGuPgTgOGNrun2vAyvhY",
        appName: "nutrient-pdf-app.vercel.app"
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