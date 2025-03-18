// build-wasm.js
const fs = require('fs');
const path = require('path');

// Source and destination paths
const sourceWasmPath = path.join(__dirname, 'node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm');
const destDir = path.join(__dirname, '.vercel/output/functions/pages/api/convert.js/node_modules/@nutrient-sdk/node/vendor');

// Create the destination directory
fs.mkdirSync(destDir, { recursive: true });

// Copy the WASM file
if (fs.existsSync(sourceWasmPath)) {
  fs.copyFileSync(sourceWasmPath, path.join(destDir, 'nutrient-viewer.wasm'));
  console.log('WASM file copied successfully!');
} else {
  console.error('Source WASM file not found:', sourceWasmPath);
}