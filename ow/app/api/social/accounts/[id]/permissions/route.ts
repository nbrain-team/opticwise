import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/social/accounts/[id]/permissions
 * List all users who have permission to this social account.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const account = await prisma.socialAccount.findUnique({
      where: { id },
      select: { userId: true, displayName: true, platform: true },
    });
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isOwnerOrAdmin =
      account.userId === session.userId || currentUser?.role === "admin";
    if (!isOwnerOrAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const permissions = await prisma.socialAccountPermission.findMany({
      where: { socialAccountId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { grantedAt: "desc" },
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("List permissions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list permissions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/accounts/[id]/permissions
 * Grant a user permission to post to this account.
 * Body: { userId: string, role?: "poster" | "viewer" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { userId, role = "poster" } = body as {
      userId: string;
      role?: string;
    };

    if (!userId)
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );

    if (!["poster", "viewer"].includes(role))
      return NextResponse.json(
        { error: "role must be poster or viewer" },
        { status: 400 }
      );

    const [account, currentUser] = await Promise.all([
      prisma.socialAccount.findUnique({ where: { id }, select: { userId: true } }),
      prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } }),
    ]);
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const isOwnerOrAdmin =
      account.userId === session.userId || currentUser?.role === "admin";
    if (!isOwnerOrAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!targetUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const permission = await prisma.socialAccountPermission.upsert({
      where: {
        socialAccountId_userId: { socialAccountId: id, userId },
      },
      create: {
        socialAccountId: id,
        userId,
        role,
        grantedBy: session.userId,
      },
      update: { role, grantedBy: session.userId },
    });

    return NextResponse.json({ permission, user: targetUser });
  } catch (error) {
    console.error("Grant permission error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to grant permission" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/accounts/[id]/permissions
 * Revoke a user's permission. Body: { userId: string }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { userId } = body as { userId: string };

    if (!userId)
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );

    const [account, currentUser] = await Promise.all([
      prisma.socialAccount.findUnique({ where: { id }, select: { userId: true } }),
      prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } }),
    ]);
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const isOwnerOrAdmin =
      account.userId === session.userId || currentUser?.role === "admin";
    if (!isOwnerOrAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.socialAccountPermission.deleteMany({
      where: { socialAccountId: id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke permission error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke permission" },
      { status: 500 }
    );
  }
}
