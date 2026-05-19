import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accounts = await prisma.socialAccount.findMany({
      where: { userId: session.userId },
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
      orderBy: { connectedAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("List social accounts error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list social accounts",
      },
      { status: 500 }
    );
  }
}
