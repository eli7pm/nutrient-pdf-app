// server.js
const express = require('express');
const next = require('next');
const multer = require('multer');
const { load } = require('@nutrient-sdk/node');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Prepare the server
app.prepare().then(() => {
  const server = express();
  
  // Add a specific route for PDF conversion
  server.post('/api/convert', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      
      // Get the file buffer
      const buffer = req.file.buffer;
      
      console.log(`Processing file: ${req.file.originalname}, size: ${buffer.length} bytes`);
      
      try {
        // Load the document with Nutrient SDK
        const instance = await load({
          document: buffer,
          // Add license if available
          // license: {
          //   key: process.env.NUTRIENT_LICENSE_KEY,
          //   appName: process.env.NUTRIENT_APP_NAME
          // }
        });
        
        // Export to PDF
        const pdfBuffer = await instance.exportPDF();
        
        // Close the instance
        await instance.close();
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="converted.pdf"`);
        
        // Send the PDF data
        return res.send(Buffer.from(pdfBuffer));
      } catch (error) {
        console.error('Nutrient SDK error:', error);
        return res.status(500).json({ 
          error: 'Conversion failed', 
          details: error.message 
        });
      }
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: error.message });
    }
  });
  
  // Handle all other routes with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});