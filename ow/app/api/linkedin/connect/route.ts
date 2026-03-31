import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import * as zernio from '@/lib/zernio';

/**
 * GET — Generate the LinkedIn OAuth URL.
 * Passes redirect_url so Zernio sends the user back to our app after auth.
 */
export async function GET(req: NextRequest) {
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

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      req.nextUrl.origin;

    const redirectUrl = `${baseUrl}/linkedin?connected=true`;

    const { authUrl } = await zernio.getConnectUrl('linkedin', profile._id, redirectUrl);

    return NextResponse.json({ authUrl, profileId: profile._id });
  } catch (error) {
    console.error('LinkedIn connect error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get connect URL' },
      { status: 500 }
    );
  }
}

/**
 * POST — Sync connected LinkedIn accounts from Zernio and bind to the current CRM user.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accounts: zernioAccounts } = await zernio.listAccounts();
    const linkedInAccounts = zernioAccounts.filter(a => a.platform === 'linkedin');

    const syncedAccounts = [];
    for (const acct of linkedInAccounts) {
      const displayName = acct.displayName || acct.name || acct.metadata?.userProfile?.displayName || acct.username;
      const avatarUrl = acct.profilePicture || acct.avatar || acct.metadata?.userProfile?.profilePicture;
      const profileUrl = acct.profileUrl || acct.metadata?.userProfile?.profileUrl;
      const accountType = acct.metadata?.accountType || acct.type;

      const existing = await prisma.linkedInAccount.findUnique({
        where: { zernioAccountId: acct._id },
      });

      if (existing) {
        const updated = await prisma.linkedInAccount.update({
          where: { id: existing.id },
          data: {
            username: acct.username ?? existing.username,
            displayName: displayName ?? existing.displayName,
            avatarUrl: avatarUrl ?? existing.avatarUrl,
            profileUrl: profileUrl ?? existing.profileUrl,
            accountType: accountType ?? existing.accountType,
            isConnected: true,
            disconnectedAt: null,
            userId: existing.userId ?? session.userId,
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
            displayName,
            avatarUrl,
            profileUrl,
            accountType,
            isConnected: true,
            userId: session.userId,
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
