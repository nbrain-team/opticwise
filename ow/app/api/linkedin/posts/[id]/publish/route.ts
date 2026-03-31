import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import * as zernio from '@/lib/zernio';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.socialPost.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existing.status === 'published') {
      return NextResponse.json({ error: 'Post is already published' }, { status: 400 });
    }

    const platformEntry: zernio.ZernioPlatformEntry = {
      platform: 'linkedin',
      accountId: existing.account.zernioAccountId,
    };
    if (existing.firstComment) {
      platformEntry.platformSpecificData = { firstComment: existing.firstComment };
    }

    const postParams: zernio.CreatePostParams = {
      content: existing.content,
      platforms: [platformEntry],
      publishNow: true,
      timezone: existing.timezone,
    };

    if (existing.mediaItems) {
      postParams.mediaItems = existing.mediaItems as unknown as zernio.ZernioMediaItem[];
    }

    const result = await zernio.createPost(postParams);

    const post = await prisma.socialPost.update({
      where: { id },
      data: {
        zernioPostId: result.post._id,
        status: 'published',
        publishedAt: new Date(),
        errorMessage: null,
      },
      include: { account: true },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Publish post error:', error);

    const { id } = await params;
    await prisma.socialPost.update({
      where: { id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Publish failed',
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish post' },
      { status: 500 }
    );
  }
}
