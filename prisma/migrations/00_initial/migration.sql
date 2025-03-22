-- CreateTable
CREATE TABLE "Game" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "whitePlayer" TEXT NOT NULL,
  "blackPlayer" TEXT NOT NULL,
  "timeControl" INTEGER NOT NULL,
  "incrementPerMove" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "winner" TEXT,

  CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Move" (
  "id" TEXT NOT NULL,
  "gameId" TEXT NOT NULL,
  "moveNumber" INTEGER NOT NULL,
  "move" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "whiteTimeLeft" INTEGER NOT NULL,
  "blackTimeLeft" INTEGER NOT NULL,

  CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Move_gameId_idx" ON "Move"("gameId");

-- AddForeignKey
ALTER TABLE "Move" ADD CONSTRAINT "Move_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 