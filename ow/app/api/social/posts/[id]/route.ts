import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const post = await prisma.socialPost.findUnique({
      where: { id },
      include: {
        socialAccount: {
          select: {
            id: true,
            displayName: true,
            platform: true,
            accountType: true,
            avatarUrl: true,
          },
        },
        comments: {
          orderBy: { commentedAt: "desc" },
          include: {
            replies: { orderBy: { commentedAt: "asc" } },
          },
        },
      },
    });

    if (!post)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Get social post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get social post",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.socialPost.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (existing.status === "published") {
      return NextResponse.json(
        { error: "Cannot update a published post" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { content, firstComment, mediaItems, scheduledFor, timezone, status } =
      body;

    const post = await prisma.socialPost.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(firstComment !== undefined && { firstComment }),
        ...(mediaItems !== undefined && { mediaItems }),
        ...(scheduledFor !== undefined && {
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        }),
        ...(timezone !== undefined && { timezone }),
        ...(status !== undefined && { status }),
      },
      include: {
        socialAccount: {
          select: {
            id: true,
            displayName: true,
            platform: true,
            accountType: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Update social post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update social post",
      },
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
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.socialPost.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const deletable: string[] = ["draft", "failed", "rejected"];
    if (!deletable.includes(existing.status)) {
      return NextResponse.json(
        {
          error: `Cannot delete a post with status "${existing.status}". Only draft, failed, or rejected posts can be deleted.`,
        },
        { status: 400 }
      );
    }

    await prisma.socialPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete social post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete social post",
      },
      { status: 500 }
    );
  }
}
