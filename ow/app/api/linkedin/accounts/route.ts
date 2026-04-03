import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import * as zernio from '@/lib/zernio';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let localAccounts = await prisma.linkedInAccount.findMany({
      where: { userId: session.userId, isConnected: true },
      orderBy: { connectedAt: 'desc' },
    });

    if (localAccounts.length === 0) {
      const { accounts: zernioAccounts } = await zernio.listAccounts();
      const linkedInAccounts = zernioAccounts.filter(a => a.platform === 'linkedin');

      for (const acct of linkedInAccounts) {
        const acctId = zernio.getAccountId(acct);
        const displayName = acct.displayName || acct.name || acct.metadata?.userProfile?.displayName || acct.username;
        const avatarUrl = acct.profilePicture || acct.avatar || acct.metadata?.userProfile?.profilePicture;
        const profileUrl = acct.profileUrl || acct.metadata?.userProfile?.profileUrl;
        const accountType = acct.accountType || acct.metadata?.accountType || acct.type;

        await prisma.linkedInAccount.upsert({
          where: { zernioAccountId: acctId },
          create: {
            zernioAccountId: acctId,
            zernioProfileId: zernio.getProfileId(acct),
            platform: 'linkedin',
            username: acct.username,
            displayName,
            avatarUrl,
            profileUrl,
            accountType,
            isConnected: true,
            userId: session.userId,
          },
          update: {
            isConnected: true,
            username: acct.username,
            displayName,
            avatarUrl,
            profileUrl,
            userId: session.userId,
          },
        });
      }

      localAccounts = await prisma.linkedInAccount.findMany({
        where: { userId: session.userId, isConnected: true },
        orderBy: { connectedAt: 'desc' },
      });
    }

    return NextResponse.json({ accounts: localAccounts });
  } catch (error) {
    console.error('List accounts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list accounts' },
      { status: 500 }
    );
  }
}
