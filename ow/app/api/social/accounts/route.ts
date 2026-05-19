import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const acctSelect = {
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
    } as const;

    const [ownedAccounts, permittedAccounts] = await Promise.all([
      prisma.socialAccount.findMany({
        where: { userId: session.userId, isConnected: true },
        select: acctSelect,
        orderBy: { connectedAt: "desc" },
      }),
      prisma.socialAccountPermission.findMany({
        where: { userId: session.userId },
        include: { socialAccount: { select: acctSelect } },
      }),
    ]);

    const mapAccount = (a: { autoPublishEnabled: boolean; [k: string]: unknown }) => {
      const { autoPublishEnabled, ...rest } = a;
      return { ...rest, autoPublish: autoPublishEnabled };
    };

    const ownedIds = new Set(ownedAccounts.map((a) => a.id));
    const shared = permittedAccounts
      .filter((p) => !ownedIds.has(p.socialAccount.id) && p.socialAccount.isConnected)
      .map((p) => ({ ...mapAccount(p.socialAccount), permissionRole: p.role }));

    const accounts = [
      ...ownedAccounts.map((a) => ({ ...mapAccount(a), permissionRole: "owner" as const })),
      ...shared,
    ];

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
