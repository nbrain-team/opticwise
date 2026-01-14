import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * PATCH /api/sales-inbox/threads/[id]
 * Update an email thread (e.g., link to a deal)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { dealId } = body;

    // Update the thread
    const thread = await prisma.emailThread.update({
      where: { id },
      data: {
        dealId: dealId || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      thread,
    });
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json(
      { error: 'Failed to update thread', details: String(error) },
      { status: 500 }
    );
  }
}

