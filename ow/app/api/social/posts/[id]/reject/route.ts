import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(
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

    if (existing.status !== "pending_approval") {
      return NextResponse.json(
        { error: "Only posts with status pending_approval can be rejected" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "A rejection reason is required" },
        { status: 400 }
      );
    }

    const post = await prisma.socialPost.update({
      where: { id },
      data: {
        status: "rejected",
        rejectedBy: session.userId,
        rejectedAt: new Date(),
        rejectReason: reason,
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
    console.error("Reject social post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reject social post",
      },
      { status: 500 }
    );
  }
}
