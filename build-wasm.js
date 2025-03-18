// build-wasm.js
const fs = require('fs');
const path = require('path');

console.log('Running WASM file copy script...');

// Find the .vercel/output directory which is created during Vercel builds
const findOutputDir = () => {
  const baseDir = path.resolve('.');
  const vercelDir = path.join(baseDir, '.vercel');
  
  if (fs.existsSync(vercelDir)) {
    const outputDir = path.join(vercelDir, 'output');
    if (fs.existsSync(outputDir)) {
      return outputDir;
    }
  }
  
  // Create output directory structure if it doesn't exist
  const newOutputDir = path.join(baseDir, '.vercel', 'output', 'functions');
  fs.mkdirSync(newOutputDir, { recursive: true });
  return path.join(baseDir, '.vercel', 'output');
};

// Copy WASM files
const copyWasmFiles = () => {
  const outputDir = findOutputDir();
  console.log('Found output directory:', outputDir);
  
  // Source WASM file
  const sourceWasmFile = path.join('node_modules', '@nutrient-sdk', 'node', 'vendor', 'nutrient-viewer.wasm');
  console.log('Looking for source WASM file:', sourceWasmFile);
  
  if (!fs.existsSync(sourceWasmFile)) {
    console.error('Source WASM file not found!');
    return;
  }
  
  // Find all function directories that might need the WASM file
  const functionsDir = path.join(outputDir, 'functions');
  if (!fs.existsSync(functionsDir)) {
    console.log('Functions directory not found, creating it');
    fs.mkdirSync(functionsDir, { recursive: true });
  }
  
  const dirs = [
    // Try various possible paths where Vercel might place the function
    path.join(functionsDir, 'pages', 'api', 'convert.func'),
    path.join(functionsDir, 'api', 'convert.func')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create vendor directory
    const vendorDir = path.join(dir, 'node_modules', '@nutrient-sdk', 'node', 'vendor');
    fs.mkdirSync(vendorDir, { recursive: true });
    
    // Copy WASM file
    const destWasmFile = path.join(vendorDir, 'nutrient-viewer.wasm');
    fs.copyFileSync(sourceWasmFile, destWasmFile);
    console.log(`Copied WASM file to: ${destWasmFile}`);
  });
  
  console.log('WASM file copy completed!');
};

try {
  copyWasmFiles();
} catch (error) {
  console.error('Error copying WASM files:', error);
}