import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma client for health checks
const prisma = new PrismaClient();

export async function GET() {
  let dbStatus = 'unknown';
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    console.error('Database health check failed:', error);
    dbStatus = 'disconnected';
  }
  
  const healthy = dbStatus === 'connected';
  
  return NextResponse.json({
    status: healthy ? 'ok' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  }, {
    status: healthy ? 200 : 503
  });
} 