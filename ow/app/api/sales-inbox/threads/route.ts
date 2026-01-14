import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/sales-inbox/threads
 * 
 * Fetches email threads for the sales inbox
 */
export async function GET() {
  try {
    const threads = await prisma.emailThread.findMany({
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
        },
        deal: true,
        person: {
          include: {
            organization: true,
          },
        },
        organization: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      threads,
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads', details: String(error) },
      { status: 500 }
    );
  }
}

