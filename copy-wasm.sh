#!/bin/bash
echo "Copying WASM files to function directories..."

# Create directories if they don't exist
mkdir -p .vercel/output/functions/api/convert.func/node_modules/@nutrient-sdk/node/vendor/
mkdir -p .vercel/output/functions/pages/api/convert.func/node_modules/@nutrient-sdk/node/vendor/

# Copy the WASM file to multiple possible locations
cp -v node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm .vercel/output/functions/api/convert.func/node_modules/@nutrient-sdk/node/vendor/
cp -v node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm .vercel/output/functions/pages/api/convert.func/node_modules/@nutrient-sdk/node/vendor/

# Also try the _vercel path you mentioned
mkdir -p _vercel/output/functions/api/convert.func/node_modules/@nutrient-sdk/node/vendor/
mkdir -p _vercel/output/functions/pages/api/convert.func/node_modules/@nutrient-sdk/node/vendor/
cp -v node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm _vercel/output/functions/api/convert.func/node_modules/@nutrient-sdk/node/vendor/
cp -v node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm _vercel/output/functions/pages/api/convert.func/node_modules/@nutrient-sdk/node/vendor/

echo "WASM files copied to multiple possible locations."