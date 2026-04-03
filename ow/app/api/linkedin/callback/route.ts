import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import * as zernio from '@/lib/zernio';

/**
 * GET — Handles the headless OAuth callback from Zernio.
 *
 * After the user authorizes on LinkedIn, Zernio redirects here with:
 *   ?tempToken=...&userProfile=...&platform=linkedin&step=select_organization
 *
 * We auto-select "personal" account type, sync the account to DB,
 * then redirect the user to /linkedin?connected=true.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tempToken = searchParams.get('tempToken');
  const userProfileRaw = searchParams.get('userProfile');
  const step = searchParams.get('step');
  const connectToken = searchParams.get('connect_token');

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    req.nextUrl.origin;

  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${baseUrl}/linkedin?error=${encodeURIComponent(msg)}`);

  try {
    const session = await getSession();
    if (!session) {
      return errorRedirect('Please log in first');
    }

    if (!tempToken || !userProfileRaw) {
      return errorRedirect('Missing OAuth data from LinkedIn');
    }

    let userProfile: Record<string, unknown>;
    try {
      userProfile = JSON.parse(decodeURIComponent(userProfileRaw));
    } catch {
      userProfile = JSON.parse(userProfileRaw);
    }

    const { profiles } = await zernio.listProfiles();
    const profile = profiles.find(p => p.isDefault) ?? profiles[0];
    if (!profile) {
      return errorRedirect('No Zernio profile configured');
    }

    let zernioAccount: zernio.ZernioAccountData | null = null;

    if (step === 'select_organization' || step === 'select') {
      const result = await zernio.selectLinkedInOrg({
        profileId: profile._id,
        tempToken,
        userProfile,
        accountType: 'personal',
      });
      zernioAccount = result.account;
    }

    if (!zernioAccount) {
      const { accounts } = await zernio.listAccounts();
      const latest = accounts
        .filter(a => a.platform === 'linkedin')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      zernioAccount = latest ?? null;
    }

    if (zernioAccount) {
      const acctId = zernio.getAccountId(zernioAccount);
      const displayName =
        zernioAccount.displayName ||
        zernioAccount.name ||
        zernioAccount.metadata?.userProfile?.displayName ||
        zernioAccount.username;
      const avatarUrl =
        zernioAccount.profilePicture ||
        zernioAccount.avatar ||
        zernioAccount.metadata?.userProfile?.profilePicture;
      const profileUrl =
        zernioAccount.profileUrl ||
        zernioAccount.metadata?.userProfile?.profileUrl;
      const accountType =
        zernioAccount.accountType ||
        zernioAccount.metadata?.accountType ||
        zernioAccount.type;

      await prisma.linkedInAccount.upsert({
        where: { zernioAccountId: acctId },
        create: {
          zernioAccountId: acctId,
          zernioProfileId: profile._id,
          platform: 'linkedin',
          username: zernioAccount.username,
          displayName,
          avatarUrl,
          profileUrl,
          accountType,
          isConnected: true,
          userId: session.userId,
        },
        update: {
          displayName,
          avatarUrl,
          profileUrl,
          accountType,
          isConnected: true,
          disconnectedAt: null,
          userId: session.userId,
        },
      });
    }

    return NextResponse.redirect(`${baseUrl}/linkedin?connected=true`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    const msg = error instanceof Error ? error.message : 'Connection failed';
    return errorRedirect(msg);
  }
}
