#!/bin/bash

# This script prepares the application for production deployment

echo "Preparing application for production deployment..."

# Detect database type from URL
if [[ "$DATABASE_URL" == *"postgres"* ]]; then
  echo "PostgreSQL database detected"
  DB_TYPE="postgresql"
  # Use the PostgreSQL schema
  cp prisma/schema.postgresql.prisma prisma/schema.prisma
  echo "Using PostgreSQL schema"
elif [[ "$DATABASE_URL" == *"sqlite"* || "$DATABASE_URL" == "file:"* ]]; then
  echo "SQLite database detected"
  DB_TYPE="sqlite"
else
  echo "Unknown database type, assuming PostgreSQL"
  DB_TYPE="postgresql"
  # Use the PostgreSQL schema
  cp prisma/schema.postgresql.prisma prisma/schema.prisma
  echo "Using PostgreSQL schema"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the application
echo "Building the application..."
npm run build

# Prepare database based on detected type
if [[ "$DB_TYPE" == "postgresql" ]]; then
  echo "PostgreSQL database detected, preparing migrations..."
  # Try to run migrations first
  npx prisma migrate deploy || npx prisma db push --accept-data-loss
elif [[ "$DB_TYPE" == "sqlite" ]]; then
  echo "SQLite database detected, using db push..."
  npx prisma db push
else
  echo "Unknown database type, attempting db push..."
  npx prisma db push --accept-data-loss
fi

echo "Application is ready for production!"
echo "Start with: NODE_ENV=production npm run start:unified" 