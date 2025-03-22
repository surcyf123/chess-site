#!/bin/bash
set -e

# Display Node.js and NPM versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies 
echo "Installing dependencies..."
npm ci

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Check chess.js dependency
echo "Chess.js version:"
npm list chess.js

# Build the Next.js app
echo "Building Next.js app..."
npm run build

echo "Build completed successfully!" 