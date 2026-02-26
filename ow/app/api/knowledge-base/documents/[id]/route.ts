import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

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
    const { name, comment, category } = body;

    const updateData: Record<string, string | null> = {};
    if (name !== undefined) updateData.name = name;
    if (comment !== undefined) updateData.comment = comment || null;
    if (category !== undefined) updateData.category = category || null;

    const doc = await prisma.knowledgeDocument.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, comment: true, category: true,
      },
    });

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.knowledgeDocument.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document', details: String(error) },
      { status: 500 }
    );
  }
}
