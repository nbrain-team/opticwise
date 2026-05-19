import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(
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

    if (existing.status !== "pending_approval") {
      return NextResponse.json(
        { error: "Only posts with status pending_approval can be approved" },
        { status: 400 }
      );
    }

    const nextStatus = existing.scheduledFor ? "scheduled" : "draft";

    const post = await prisma.socialPost.update({
      where: { id },
      data: {
        status: nextStatus,
        approvedBy: session.userId,
        approvedAt: new Date(),
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
    console.error("Approve social post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve social post",
      },
      { status: 500 }
    );
  }
}
