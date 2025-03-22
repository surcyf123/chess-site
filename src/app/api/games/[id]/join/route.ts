import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { color } = body;

    const game = await prisma.game.update({
      where: {
        id: params.id,
      },
      data: {
        ...(color === 'white' ? { whitePlayer: 'player1' } : { blackPlayer: 'player2' }),
        status: 'ongoing',
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
} 