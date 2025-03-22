#!/bin/bash

# Test Docker build locally

echo "Testing Docker build..."

# Ensure prisma directory exists
mkdir -p prisma

# Ensure schema files exist
if [ ! -f "prisma/schema.prisma" ]; then
  echo "Creating schema.prisma..."
  cp prisma/schema.postgresql.prisma prisma/schema.prisma 2>/dev/null || \
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
  // Historical moves relationship
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

# Run docker build
docker build -t chess-site-test .

echo "Build completed."
echo "If successful, run 'docker run -p 8080:8080 -e DATABASE_URL=postgresql://user:password@host:5432/dbname chess-site-test' to test locally." 