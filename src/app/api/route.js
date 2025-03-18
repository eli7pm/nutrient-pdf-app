// src/app/api/convert/route.js
import { load } from '@nutrient-sdk/node';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export async function POST(request) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a temporary file path to store the converted PDF
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `converted-${Date.now()}.pdf`);
    
    // Load the document with Nutrient SDK
    const instance = await load({
      document: buffer,
      // Uncomment and add your license key when you have one
      // license: {
      //   key: process.env.NUTRIENT_LICENSE_KEY,
      //   appName: process.env.NUTRIENT_APP_NAME
      // }
    });
    
    // Export to PDF
    const pdfBuffer = await instance.exportPDF();
    
    // Close the instance
    await instance.close();
    
    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="converted.pdf"'
      }
    });
  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}