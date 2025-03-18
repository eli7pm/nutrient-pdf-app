#!/bin/bash
echo "Copying WASM files to function directory..."
mkdir -p .vercel/output/functions/pages/api/convert.func/node_modules/@nutrient-sdk/node/vendor/
cp -v node_modules/@nutrient-sdk/node/vendor/nutrient-viewer.wasm .vercel/output/functions/pages/api/convert.func/node_modules/@nutrient-sdk/node/vendor/