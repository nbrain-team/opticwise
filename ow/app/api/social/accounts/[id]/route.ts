import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const account = await prisma.socialAccount.findUnique({ where: { id } });
    if (!account)
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );

    if (account.userId !== session.userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.socialAccount.update({
      where: { id },
      data: {
        isConnected: false,
        disconnectedAt: new Date(),
        accessToken: null,
        refreshToken: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect social account error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to disconnect account",
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

    const account = await prisma.socialAccount.findUnique({ where: { id } });
    if (!account)
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );

    if (account.userId !== session.userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { autoPublishEnabled } = body;

    const updated = await prisma.socialAccount.update({
      where: { id },
      data: {
        ...(autoPublishEnabled !== undefined && { autoPublishEnabled }),
      },
      select: {
        id: true,
        platform: true,
        platformAccountId: true,
        accountType: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        profileUrl: true,
        isConnected: true,
        autoPublishEnabled: true,
        connectedAt: true,
        userId: true,
      },
    });

    return NextResponse.json({ account: updated });
  } catch (error) {
    console.error("Update social account error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update account",
      },
      { status: 500 }
    );
  }
}
