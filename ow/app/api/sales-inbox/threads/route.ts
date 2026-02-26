import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * GET /api/sales-inbox/threads?q=search+term
 * 
 * Fetches email threads scoped to the logged-in user.
 * Users can only see threads from their own synced emails.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchQuery = request.nextUrl.searchParams.get('q')?.trim();

    const baseWhere: Record<string, unknown> = {
      syncUserId: session.userId,
    };

    if (searchQuery) {
      baseWhere.OR = [
        { subject: { contains: searchQuery, mode: 'insensitive' as const } },
        { person: { firstName: { contains: searchQuery, mode: 'insensitive' as const } } },
        { person: { lastName: { contains: searchQuery, mode: 'insensitive' as const } } },
        { person: { email: { contains: searchQuery, mode: 'insensitive' as const } } },
        { organization: { name: { contains: searchQuery, mode: 'insensitive' as const } } },
        { messages: { some: { body: { contains: searchQuery, mode: 'insensitive' as const } } } },
        { messages: { some: { sender: { contains: searchQuery, mode: 'insensitive' as const } } } },
      ];
    }

    const threads = await prisma.emailThread.findMany({
      where: baseWhere,
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
