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

    const localAccounts = await prisma.linkedInAccount.findMany({
      where: { isConnected: true },
      orderBy: { connectedAt: 'desc' },
    });

    if (localAccounts.length === 0) {
      const { accounts: zernioAccounts } = await zernio.listAccounts();
      const linkedInAccounts = zernioAccounts.filter(a => a.platform === 'linkedin');

      if (linkedInAccounts.length > 0) {
        const created = [];
        for (const acct of linkedInAccounts) {
          const record = await prisma.linkedInAccount.upsert({
            where: { zernioAccountId: acct._id },
            create: {
              zernioAccountId: acct._id,
              zernioProfileId: acct.profileId ?? '',
              platform: 'linkedin',
              username: acct.username,
              displayName: acct.name,
              avatarUrl: acct.avatar,
              accountType: acct.type,
              isConnected: true,
            },
            update: {
              isConnected: true,
              username: acct.username,
              displayName: acct.name,
              avatarUrl: acct.avatar,
            },
          });
          created.push(record);
        }
        return NextResponse.json({ accounts: created });
      }
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
