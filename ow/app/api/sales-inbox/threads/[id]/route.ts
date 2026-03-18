import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * PATCH /api/sales-inbox/threads/[id]
 * Update an email thread (e.g., link to a deal).
 * Also syncs the dealId to corresponding GmailMessage records
 * so linked emails appear on the deal detail page.
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

    const thread = await prisma.emailThread.update({
      where: { id },
      data: {
        dealId: dealId || null,
        updatedAt: new Date(),
      },
    });

    // Also link/unlink corresponding GmailMessage records so they
    // appear on the deal detail page's Emails tab.
    if (thread.subject) {
      const whereClause: Record<string, unknown> = {
        subject: thread.subject,
      };
      if (thread.personId) whereClause.personId = thread.personId;
      if (thread.syncUserId) whereClause.syncUserId = thread.syncUserId;

      await prisma.gmailMessage.updateMany({
        where: whereClause,
        data: { dealId: dealId || null },
      });
    }

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

