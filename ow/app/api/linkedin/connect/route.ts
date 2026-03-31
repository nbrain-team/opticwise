import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import * as zernio from '@/lib/zernio';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profiles } = await zernio.listProfiles();
    const profile = profiles.find(p => p.isDefault) ?? profiles[0];
    if (!profile) {
      return NextResponse.json({ error: 'No Zernio profile found' }, { status: 500 });
    }

    const { authUrl } = await zernio.getConnectUrl('linkedin', profile._id);
    return NextResponse.json({ authUrl, profileId: profile._id });
  } catch (error) {
    console.error('LinkedIn connect error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get connect URL' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accounts: zernioAccounts } = await zernio.listAccounts();
    const linkedInAccounts = zernioAccounts.filter(a => a.platform === 'linkedin');

    const syncedAccounts = [];
    for (const acct of linkedInAccounts) {
      const existing = await prisma.linkedInAccount.findUnique({
        where: { zernioAccountId: acct._id },
      });

      if (existing) {
        const updated = await prisma.linkedInAccount.update({
          where: { id: existing.id },
          data: {
            username: acct.username ?? existing.username,
            displayName: acct.name ?? existing.displayName,
            avatarUrl: acct.avatar ?? existing.avatarUrl,
            accountType: acct.type ?? existing.accountType,
            isConnected: true,
            disconnectedAt: null,
          },
        });
        syncedAccounts.push(updated);
      } else {
        const created = await prisma.linkedInAccount.create({
          data: {
            zernioAccountId: acct._id,
            zernioProfileId: acct.profileId ?? '',
            platform: 'linkedin',
            username: acct.username,
            displayName: acct.name,
            avatarUrl: acct.avatar,
            accountType: acct.type,
            isConnected: true,
          },
        });
        syncedAccounts.push(created);
      }
    }

    return NextResponse.json({ accounts: syncedAccounts, synced: syncedAccounts.length });
  } catch (error) {
    console.error('LinkedIn sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync accounts' },
      { status: 500 }
    );
  }
}
