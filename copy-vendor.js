// copy-vendor.js
const fs = require('fs');
const path = require('path');

// Source and destination paths
const sourceVendorDir = path.join(__dirname, 'node_modules/@nutrient-sdk/node/vendor');
const destVendorDir = path.join(__dirname, 'public/vendor');

// Create destination directory
fs.mkdirSync(destVendorDir, { recursive: true });

// Function to copy directory recursively
function copyDirectoryRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read all files and directories in source
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

try {
  // Copy the entire vendor directory
  copyDirectoryRecursive(sourceVendorDir, destVendorDir);
  console.log('Vendor directory copied successfully!');
} catch (error) {
  console.error('Error copying vendor directory:', error);
}