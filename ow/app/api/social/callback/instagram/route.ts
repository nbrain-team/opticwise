import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  exchangeCodeForMetaToken,
  exchangeForLongLivedToken,
  discoverInstagramAccounts,
} from "@/lib/instagram-api";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ownet.opticwise.com";

  if (!session) {
    return NextResponse.redirect(`${appUrl}/social?error=not_authenticated`);
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/social?error=instagram_auth_denied`
    );
  }

  try {
    const redirectUri = `${appUrl}/api/social/callback/instagram`;

    const shortToken = await exchangeCodeForMetaToken(code, redirectUri);
    const longToken = await exchangeForLongLivedToken(shortToken.access_token);
    const tokenExpiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // default 60 days

    let igAccounts;
    try {
      igAccounts = await discoverInstagramAccounts(longToken.access_token);
    } catch (discoverErr) {
      console.error("Instagram discovery error:", discoverErr);
      const msg = discoverErr instanceof Error ? discoverErr.message : "Discovery failed";
      return NextResponse.redirect(
        `${appUrl}/social?error=${encodeURIComponent(msg)}`
      );
    }

    if (igAccounts.length === 0) {
      // Check how many pages the token can see for diagnostics
      let pageCount = 0;
      try {
        const debugResp = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?fields=id,name&access_token=${longToken.access_token}`
        );
        if (debugResp.ok) {
          const debugData = await debugResp.json() as { data: unknown[] };
          pageCount = debugData.data?.length ?? 0;
        }
      } catch { /* ignore */ }

      const detail = pageCount === 0
        ? "No Facebook Pages found — your Meta account may not manage any Pages, or the app needs pages_show_list permission"
        : `Found ${pageCount} Facebook Page(s) but none have a linked Instagram Business account — link Instagram to your FB Page in the Instagram app (Edit Profile → Page)`;
      return NextResponse.redirect(
        `${appUrl}/social?error=${encodeURIComponent(detail)}`
      );
    }

    for (const ig of igAccounts) {
      await prisma.socialAccount.upsert({
        where: {
          platform_platformAccountId: {
            platform: "instagram",
            platformAccountId: ig.igUserId,
          },
        },
        update: {
          accessToken: longToken.access_token,
          tokenExpiresAt,
          isConnected: true,
          connectedAt: new Date(),
          disconnectedAt: null,
          displayName: ig.igName,
          username: ig.igUsername,
          avatarUrl: ig.profilePictureUrl || null,
          profileUrl: `https://instagram.com/${ig.igUsername}`,
        },
        create: {
          platform: "instagram",
          platformAccountId: ig.igUserId,
          accountType: "business",
          displayName: ig.igName,
          username: ig.igUsername,
          avatarUrl: ig.profilePictureUrl || null,
          profileUrl: `https://instagram.com/${ig.igUsername}`,
          accessToken: longToken.access_token,
          tokenExpiresAt,
          isConnected: true,
          connectedAt: new Date(),
          userId: session.userId,
        },
      });
    }

    const response = NextResponse.redirect(`${appUrl}/social?connected=instagram`);
    response.cookies.delete("ig_oauth_state");
    return response;
  } catch (err) {
    console.error("Instagram OAuth callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/social?error=instagram_auth_failed`
    );
  }
}
