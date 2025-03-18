// copy-vendor.js
const fs = require('fs');
const path = require('path');

// Source directories
const sourceVendorDir = path.join(__dirname, 'node_modules/@nutrient-sdk/node/vendor');
const destVendorDir = path.join(__dirname, 'public/vendor');

// Create destination directory
fs.mkdirSync(destVendorDir, { recursive: true });

// List of critical files to copy
const criticalFiles = [
  'nutrient-viewer.wasm',
  'nutrient-viewer.wasm.js'
];

// Copy only the essential WASM files
for (const file of criticalFiles) {
  const sourcePath = path.join(sourceVendorDir, file);
  const destPath = path.join(destVendorDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied: ${sourcePath} -> ${destPath}`);
  } else {
    console.warn(`Warning: File not found: ${sourcePath}`);
  }
}

// Create gdpicture directory
const gdpictureDir = path.join(destVendorDir, 'gdpicture');
const gdpictureAotDir = path.join(gdpictureDir, 'aot');
fs.mkdirSync(gdpictureAotDir, { recursive: true });

// Copy a minimal set of gdpicture files (just to demonstrate we're being selective)
const gdpictureSourceDir = path.join(sourceVendorDir, 'gdpicture', 'aot');
const essentialGdPictureFiles = [
  'GdPicture.NET.14.Document.wasm',
  'GdPicture.NET.14.PDF.wasm'
];

for (const file of essentialGdPictureFiles) {
  const sourcePath = path.join(gdpictureSourceDir, file);
  const destPath = path.join(gdpictureAotDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied: ${sourcePath} -> ${destPath}`);
  } else {
    console.warn(`Warning: File not found: ${sourcePath}`);
  }
}

console.log('Essential vendor files copied successfully!');