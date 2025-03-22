import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { timeControl, incrementPerMove } = body;

    const game = await prisma.game.create({
      data: {
        whitePlayer: '',  // Will be set when player joins
        blackPlayer: '',  // Will be set when player joins
        timeControl,
        incrementPerMove,
        status: 'waiting',
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
} 