import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/sales-inbox/threads?q=search+term
 * 
 * Fetches email threads for the sales inbox with optional search
 */
export async function GET(request: NextRequest) {
  try {
    const searchQuery = request.nextUrl.searchParams.get('q')?.trim();

    const where = searchQuery ? {
      OR: [
        { subject: { contains: searchQuery, mode: 'insensitive' as const } },
        { person: { firstName: { contains: searchQuery, mode: 'insensitive' as const } } },
        { person: { lastName: { contains: searchQuery, mode: 'insensitive' as const } } },
        { person: { email: { contains: searchQuery, mode: 'insensitive' as const } } },
        { organization: { name: { contains: searchQuery, mode: 'insensitive' as const } } },
        { messages: { some: { body: { contains: searchQuery, mode: 'insensitive' as const } } } },
        { messages: { some: { sender: { contains: searchQuery, mode: 'insensitive' as const } } } },
      ],
    } : undefined;

    const threads = await prisma.emailThread.findMany({
      where,
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
      take: 200,
    });

    // Sort by the most recent message sentAt (newest thread on top)
    threads.sort((a, b) => {
      const aLatest = a.messages[0]?.sentAt ? new Date(a.messages[0].sentAt).getTime() : 0;
      const bLatest = b.messages[0]?.sentAt ? new Date(b.messages[0].sentAt).getTime() : 0;
      return bLatest - aLatest;
    });

    return NextResponse.json({
      success: true,
      threads,
      query: searchQuery || null,
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads', details: String(error) },
      { status: 500 }
    );
  }
}

