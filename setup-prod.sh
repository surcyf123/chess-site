#!/bin/bash

# Chess Site Production Setup Script

echo "🔧 Setting up Chess Site production environment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL to your production database connection string"
  echo "For example: export DATABASE_URL=\"postgresql://user:password@host:port/dbname\""
  exit 1
else
  echo "✅ DATABASE_URL is set"
fi

# Make sure we're using PostgreSQL schema for production
if [ -f prisma/schema.postgresql.prisma ]; then
  echo "Ensuring PostgreSQL schema for production..."
  cp prisma/schema.postgresql.prisma prisma/schema.prisma
  echo "✅ PostgreSQL schema set up"
fi

# Make sure node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
else
  echo "✅ Dependencies already installed"
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss
echo "✅ Database set up"

# Build application
echo "Building application..."
npm run build
echo "✅ Application built"

# Start production server
echo "🚀 Starting production server..."
echo "You can access the application at http://localhost:${PORT:-3000}"
NODE_ENV=production npm run start:unified

echo "✅ Production environment setup complete!" 