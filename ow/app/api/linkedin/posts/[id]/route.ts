import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/db';
import * as zernio from '@/lib/zernio';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.socialPost.findUnique({
      where: { id },
      include: {
        account: true,
        comments: {
          orderBy: { commentedAt: 'desc' },
          include: {
            replies: { orderBy: { commentedAt: 'asc' } },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      content,
      firstComment,
      mediaItems,
      mediaType,
      scheduledFor,
      timezone,
      aiTopicCategory,
    } = body;

    const existing = await prisma.socialPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existing.zernioPostId && existing.status !== 'published') {
      try {
        const updateParams: Partial<zernio.CreatePostParams> = {};
        if (content) updateParams.content = content;
        if (scheduledFor) updateParams.scheduledFor = scheduledFor;
        if (timezone) updateParams.timezone = timezone;
        if (mediaItems) updateParams.mediaItems = mediaItems;
        await zernio.updatePost(existing.zernioPostId, updateParams);
      } catch (zErr) {
        console.error('Zernio update error:', zErr);
      }
    }

    const post = await prisma.socialPost.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(firstComment !== undefined && { firstComment }),
        ...(mediaItems !== undefined && { mediaItems }),
        ...(mediaType !== undefined && { mediaType }),
        ...(scheduledFor !== undefined && { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }),
        ...(timezone !== undefined && { timezone }),
        ...(aiTopicCategory !== undefined && { aiTopicCategory }),
      },
      include: { account: true },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.socialPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existing.zernioPostId) {
      try {
        await zernio.deletePost(existing.zernioPostId);
      } catch (zErr) {
        console.error('Zernio delete error:', zErr);
      }
    }

    await prisma.socialPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    );
  }
}
