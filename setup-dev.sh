#!/bin/bash

# Chess Site Development Setup Script

echo "🔧 Setting up Chess Site development environment..."

# Ensure .env file exists with correct values
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
NODE_ENV="development"
PORT="3000"
EOF
  echo "✅ Created .env file"
else
  echo "✅ .env file already exists"
fi

# Make sure we're using SQLite schema for development
if [ -f prisma/schema.postgresql.prisma ]; then
  echo "Ensuring SQLite schema for development..."
  cp prisma/schema.prisma prisma/schema.backup.prisma 2>/dev/null || true
  # Use SQLite provider instead of PostgreSQL
  sed 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma > prisma/schema.temp.prisma
  mv prisma/schema.temp.prisma prisma/schema.prisma
  echo "✅ SQLite schema set up"
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

# Push schema to database
echo "Setting up database..."
npx prisma db push
echo "✅ Database schema pushed"

# Start development server
echo "🚀 Starting development server..."
echo "You can access the application at http://localhost:3000"
npm run dev:full

echo "✅ Development environment setup complete!" 