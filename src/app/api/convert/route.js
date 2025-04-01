// app/api/convert/route.js
import { NextResponse } from 'next/server';
import { load } from '@nutrient-sdk/node';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};

export async function POST(request) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert the file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('Successfully loaded file, size:', buffer.byteLength);
    console.log('Loading @nutrient-sdk/node...');

    // Use the SDK
    const instance = await load({
      document: buffer,
      // license config if available
    });

    console.log('SDK loaded, exporting to PDF...');

    // Export to PDF
    const pdfBuffer = await instance.exportPDF();
    
    // Close the instance
    await instance.close();
    
    // Return the PDF
    const response = new NextResponse(Buffer.from(pdfBuffer));
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', 'attachment; filename="converted.pdf"');
    
    return response;
  } catch (error) {
    console.error('Conversion error:', error);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      return NextResponse.json({ 
        error: 'Could not load Nutrient SDK',
        details: 'Module resolution failed: ' + error.message
      }, { status: 500 });
    }
    
    if (error.code === 'ENOENT' && error.path && error.path.includes('.wasm')) {
      return NextResponse.json({ 
        error: 'WASM file not found',
        details: `Missing file: ${error.path}`
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Conversion failed',
      details: error.message
    }, { status: 500 });
  }
}