#!/bin/bash

# Render deployment helper script

# Clean up build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf .next node_modules

# Ensure we have the latest package.json
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the app
echo "Building the application..."
npm run build

echo "Your app is ready to deploy to Render!"
echo "Push these changes to your repository and Render will automatically deploy."
echo "Or manually trigger a deploy from the Render dashboard." 