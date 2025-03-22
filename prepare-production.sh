#!/bin/bash

# This script prepares the application for production deployment

echo "Preparing application for production deployment..."

# Check if prisma directory exists, if not create it
if [ ! -d "prisma" ]; then
  echo "Creating prisma directory..."
  mkdir -p prisma
fi

# Detect database type from URL
if [[ "$DATABASE_URL" == *"postgres"* ]]; then
  echo "PostgreSQL database detected"
  DB_TYPE="postgresql"
  
  # Check if PostgreSQL schema exists
  if [ -f "prisma/schema.postgresql.prisma" ]; then
    # Use the PostgreSQL schema
    cp prisma/schema.postgresql.prisma prisma/schema.prisma
    echo "Using PostgreSQL schema"
  else
    echo "Warning: schema.postgresql.prisma not found"
    # Create a basic schema if none exists
    if [ ! -f "prisma/schema.prisma" ]; then
      echo "Creating basic PostgreSQL schema..."
      cat > prisma/schema.prisma << EOF
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Game {
  id               String   @id @default(uuid())
  whitePlayer      String?
  blackPlayer      String?
  status           String   @default("waiting")
  winner           String?
  createdAt        DateTime @default(now())
  lastMoveAt       DateTime @default(now())
  fen              String?
  timeControl      Int      @default(300)
  incrementPerMove Int      @default(3)
  whiteTimeLeft    Int      @default(300)
  blackTimeLeft    Int      @default(300)
  movesJson        String?
  moveHistory      Move[]
}

model Move {
  id             String   @id @default(uuid())
  gameId         String
  game           Game     @relation(fields: [gameId], references: [id])
  moveNumber     Int
  move           String   // The move in algebraic notation
  timestamp      DateTime @default(now())
  whiteTimeLeft  Int      // Time left for white player in seconds
  blackTimeLeft  Int      // Time left for black player in seconds

  @@index([gameId])
}
EOF
    fi
  fi
elif [[ "$DATABASE_URL" == *"sqlite"* || "$DATABASE_URL" == "file:"* ]]; then
  echo "SQLite database detected"
  DB_TYPE="sqlite"
  
  # Create a basic SQLite schema if none exists
  if [ ! -f "prisma/schema.prisma" ]; then
    echo "Creating basic SQLite schema..."
    cat > prisma/schema.prisma << EOF
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Game {
  id               String   @id @default(uuid())
  whitePlayer      String?
  blackPlayer      String?
  status           String   @default("waiting")
  winner           String?
  createdAt        DateTime @default(now())
  lastMoveAt       DateTime @default(now())
  fen              String?
  timeControl      Int      @default(300)
  incrementPerMove Int      @default(3)
  whiteTimeLeft    Int      @default(300)
  blackTimeLeft    Int      @default(300)
  movesJson        String?
  moveHistory      Move[]
}

model Move {
  id             String   @id @default(uuid())
  gameId         String
  game           Game     @relation(fields: [gameId], references: [id])
  moveNumber     Int
  move           String   // The move in algebraic notation
  timestamp      DateTime @default(now())
  whiteTimeLeft  Int      // Time left for white player in seconds
  blackTimeLeft  Int      // Time left for black player in seconds

  @@index([gameId])
}
EOF
  fi
else
  echo "Unknown database type, assuming PostgreSQL"
  DB_TYPE="postgresql"
  
  # Create a basic PostgreSQL schema if none exists
  if [ ! -f "prisma/schema.prisma" ]; then
    echo "Creating basic PostgreSQL schema..."
    cat > prisma/schema.prisma << EOF
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Game {
  id               String   @id @default(uuid())
  whitePlayer      String?
  blackPlayer      String?
  status           String   @default("waiting")
  winner           String?
  createdAt        DateTime @default(now())
  lastMoveAt       DateTime @default(now())
  fen              String?
  timeControl      Int      @default(300)
  incrementPerMove Int      @default(3)
  whiteTimeLeft    Int      @default(300)
  blackTimeLeft    Int      @default(300)
  movesJson        String?
  moveHistory      Move[]
}

model Move {
  id             String   @id @default(uuid())
  gameId         String
  game           Game     @relation(fields: [gameId], references: [id])
  moveNumber     Int
  move           String   // The move in algebraic notation
  timestamp      DateTime @default(now())
  whiteTimeLeft  Int      // Time left for white player in seconds
  blackTimeLeft  Int      // Time left for black player in seconds

  @@index([gameId])
}
EOF
  fi
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