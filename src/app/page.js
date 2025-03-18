// src/app/page.js
'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to convert');
      return;
    }

    try {
      setIsConverting(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      // This endpoint will be handled by the Express server
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to convert document');
      }

      // Create a blob from the PDF response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'converted.pdf';
      
      // Append to the document and trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
      console.error('Error converting file:', err);
    } finally {
      setIsConverting(false);
    }
  };

  // The rest of your component remains the same
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
          
          {error && <div className="mb-4 text-red-500">{error}</div>}
          
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