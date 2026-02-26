import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.knowledgeDocument.findMany({
      select: {
        id: true,
        name: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        comment: true,
        category: true,
        uploadedBy: true,
        vectorized: true,
        createdAt: true,
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents', details: String(error) },
      { status: 500 }
    );
  }
}
