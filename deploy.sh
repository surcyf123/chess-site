#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Set up the database
echo "Setting up the database..."
npx prisma generate
npx prisma db push

# Start the application
echo "Starting the application..."
npm run start:unified 