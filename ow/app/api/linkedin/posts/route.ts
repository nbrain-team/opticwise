import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { SocialPostStatus } from '@prisma/client';
import * as zernio from '@/lib/zernio';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        include: {
          account: true,
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.socialPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total });
  } catch (error) {
    console.error('List posts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      content,
      firstComment,
      mediaItems,
      mediaType,
      accountId,
      scheduledFor,
      timezone = 'America/Denver',
      publishNow = false,
      aiGenerated = false,
      aiPrompt,
      aiTopicCategory,
    } = body;

    if (!content || !accountId) {
      return NextResponse.json(
        { error: 'Content and accountId are required' },
        { status: 400 }
      );
    }

    const account = await prisma.linkedInAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    let zernioPostId: string | null = null;
    let status = 'draft';
    let publishedAt: Date | null = null;

    if (publishNow || scheduledFor) {
      const platformEntry: zernio.ZernioPlatformEntry = {
        platform: 'linkedin',
        accountId: account.zernioAccountId,
      };
      if (firstComment) {
        platformEntry.platformSpecificData = { firstComment };
      }

      const postParams: zernio.CreatePostParams = {
        content,
        platforms: [platformEntry],
        timezone,
      };

      if (mediaItems && mediaItems.length > 0) {
        postParams.mediaItems = mediaItems;
      }

      if (publishNow) {
        postParams.publishNow = true;
        status = 'published';
        publishedAt = new Date();
      } else if (scheduledFor) {
        postParams.scheduledFor = scheduledFor;
        status = 'scheduled';
      }

      try {
        const result = await zernio.createPost(postParams);
        zernioPostId = result.post._id || result.post.id || null;
        if (result.post.status) status = result.post.status;
      } catch (zErr) {
        console.error('Zernio post creation error:', zErr);
        status = 'failed';
        const post = await prisma.socialPost.create({
          data: {
            accountId,
            content,
            firstComment,
            mediaItems,
            mediaType,
            status: 'failed' as SocialPostStatus,
            timezone,
            aiGenerated,
            aiPrompt,
            aiTopicCategory,
            errorMessage: zErr instanceof Error ? zErr.message : 'Zernio API error',
            createdBy: session.email,
          },
        });
        return NextResponse.json({ post, error: 'Post creation failed on Zernio' }, { status: 502 });
      }
    }

    const post = await prisma.socialPost.create({
      data: {
        zernioPostId,
        accountId,
        content,
        firstComment,
        mediaItems,
        mediaType,
        status: status as SocialPostStatus,
        publishedAt,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        timezone,
        aiGenerated,
        aiPrompt,
        aiTopicCategory,
        createdBy: session.email,
      },
      include: { account: true },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    );
  }
}
