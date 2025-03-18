// src/app/page.js
'use client';

import { useState } from 'react';
import './styles.css'; // We'll create this basic CSS file

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

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert document');
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

  return (
    <main className="container">
      <div className="content">
        <h1 className="title">Document to PDF Converter</h1>
        
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="label">
              Upload a document (DOCX, JPG, PNG, etc.)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="file-input"
              accept=".docx,.doc,.png,.jpg,.jpeg"
            />
          </div>
          
          {error && <div className="error">{error}</div>}
          
          <div className="button-container">
            <button
              type="submit"
              disabled={isConverting || !file}
              className={`button ${(isConverting || !file) ? 'disabled' : ''}`}
            >
              {isConverting ? 'Converting...' : 'Convert to PDF'}
            </button>
          </div>
        </form>
        
        <div className="footer">
          <p>Powered by Nutrient (formerly PSPDFKit)</p>
        </div>
      </div>
    </main>
  );
}