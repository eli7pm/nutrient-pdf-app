// src/app/api/convert/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Dynamic import of the Nutrient SDK
    // This helps prevent issues during build time
    const { load } = await import('@nutrient-sdk/node');
    
    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
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