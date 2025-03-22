#!/bin/bash

# This script prepares the application for production deployment

echo "Preparing application for production deployment..."

# Set DATABASE_PROVIDER based on DATABASE_URL
if [[ "$DATABASE_URL" == *"postgres"* ]]; then
  echo "PostgreSQL database detected, setting DATABASE_PROVIDER=postgresql"
  export DATABASE_PROVIDER="postgresql"
elif [[ "$DATABASE_URL" == *"sqlite"* || "$DATABASE_URL" == "file:"* ]]; then
  echo "SQLite database detected, setting DATABASE_PROVIDER=sqlite"
  export DATABASE_PROVIDER="sqlite"
else
  echo "Unknown database type, defaulting to DATABASE_PROVIDER=postgresql"
  export DATABASE_PROVIDER="postgresql"
fi

# Install dependencies
echo "Installing dependencies..."
npm ci || npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the application
echo "Building the application..."
npm run build

# Prepare database based on provider
if [[ "$DATABASE_URL" == *"postgres"* ]]; then
  echo "PostgreSQL database detected, preparing migrations..."
  # Try to run migrations first
  npx prisma migrate deploy || npx prisma db push --accept-data-loss
elif [[ "$DATABASE_URL" == *"sqlite"* || "$DATABASE_URL" == "file:"* ]]; then
  echo "SQLite database detected, using db push..."
  npx prisma db push
else
  echo "Unknown database type, attempting db push..."
  npx prisma db push --accept-data-loss
fi

echo "Application is ready for production!"
echo "Start with: NODE_ENV=production npm run start:unified" 