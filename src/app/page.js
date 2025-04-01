// src/app/page.js
'use client';

import { useState } from 'react';
import './styles.css'; // Fallback styles

export default function Home() {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setErrorDetails(null);
    }
  };

// Update the handleSubmit function in your page.js file

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!file) {
    setError('Please select a file to convert');
    return;
  }

  try {
    setIsConverting(true);
    setError(null);
    setErrorDetails(null);

    const formData = new FormData();
    formData.append('file', file);

    // Use the convert API endpoint
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert document', { 
          cause: { details: errorData.details, path: errorData.path } 
        });
      } else {
        // If it's not JSON, just use the status text
        throw new Error(`Conversion failed: ${response.status} ${response.statusText}`);
      }
    }

    // Check content type to determine response type
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      // We got a JSON response with a URL to the converted PDF
      const data = await response.json();
      
      if (data.success && data.url) {
        // Create a download link for the PDF URL
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = data.url;
        a.download = data.filename || 'converted.pdf';
        
        // Append to the document and trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } else {
      // We got redirected directly to the PDF (should not happen with the default implementation)
      // But handle it just in case
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
      
      // Append to the document and trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (err) {
    console.error('Error converting file:', err);
    setError(err.message);
    // Check if there are additional details in the error
    if (err.cause && err.cause.details) {
      setErrorDetails(err.cause.details);
    }
  } finally {
    setIsConverting(false);
  }
};

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex flex-col">
        <h1 className="text-4xl font-bold mb-8">Document to PDF Converter</h1>
        
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Upload a document (PDF, Office, or Image)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              accept=".pdf,.docx,.doc,.dotx,.docm,.pptx,.ppt,.pptm,.ppsx,.xlsx,.xls,.xlsm,.png,.jpeg,.jpg,.tiff,.tif"
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-600 rounded">
              <p className="font-bold">{error}</p>
              {errorDetails && <p className="text-sm mt-1">{errorDetails}</p>}
            </div>
          )}
          
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={isConverting || !file}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                (isConverting || !file) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isConverting ? 'Converting...' : 'Convert to PDF'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <p>Powered by Nutrient (formerly PSPDFKit)</p>
        </div>
      </div>
    </main>
  );
}