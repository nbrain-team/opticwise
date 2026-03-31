import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
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
    const post = await prisma.socialPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.zernioPostId) {
      try {
        const { comments: zernioComments } = await zernio.listComments({
          postId: post.zernioPostId,
          platform: 'linkedin',
        });

        for (const c of zernioComments) {
          await prisma.postComment.upsert({
            where: { zernioCommentId: c._id },
            create: {
              zernioCommentId: c._id,
              postId: post.id,
              authorName: c.author.name,
              authorUsername: c.author.username,
              authorAvatar: c.author.avatar,
              authorProfileUrl: c.author.profileUrl,
              content: c.content,
              isReply: !!c.parentCommentId,
              commentedAt: new Date(c.createdAt),
            },
            update: {
              content: c.content,
              authorName: c.author.name,
              authorAvatar: c.author.avatar,
            },
          });
        }
      } catch (zErr) {
        console.error('Zernio comments fetch error:', zErr);
      }
    }

    const comments = await prisma.postComment.findMany({
      where: { postId: id, isReply: false },
      include: {
        replies: { orderBy: { commentedAt: 'asc' } },
      },
      orderBy: { commentedAt: 'desc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { commentId, content } = await req.json();

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'commentId and content are required' },
        { status: 400 }
      );
    }

    const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
    if (!comment || !comment.zernioCommentId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const result = await zernio.replyToComment(comment.zernioCommentId, content);

    await prisma.postComment.update({
      where: { id: commentId },
      data: {
        repliedWith: content,
        repliedAt: new Date(),
      },
    });

    const reply = await prisma.postComment.create({
      data: {
        zernioCommentId: result.comment._id,
        postId: id,
        authorName: 'You',
        content,
        isReply: true,
        parentCommentId: commentId,
        commentedAt: new Date(),
      },
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Reply to comment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reply to comment' },
      { status: 500 }
    );
  }
}
