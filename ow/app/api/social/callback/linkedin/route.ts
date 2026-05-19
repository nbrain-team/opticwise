import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  exchangeCodeForToken,
  getMyProfile,
  getAdministeredOrgs,
} from "@/lib/linkedin-api";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://ownet.opticwise.com";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const redirect = (path: string) =>
    NextResponse.redirect(`${APP_URL}${path}`);

  if (error || !code) {
    console.error("LinkedIn OAuth denied or missing code:", error);
    return redirect("/social?error=linkedin_auth_failed");
  }

  try {
    const session = await getSession();
    if (!session) {
      return redirect("/social?error=linkedin_auth_failed");
    }

    const storedState = req.cookies.get("li_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      console.error("LinkedIn OAuth state mismatch");
      return redirect("/social?error=linkedin_auth_failed");
    }

    const redirectUri = `${APP_URL}/api/social/callback/linkedin`;
    const isOrgApp = req.cookies.get("li_org_app")?.value === "1";

    const token = await exchangeCodeForToken(code, redirectUri, isOrgApp);
    const profile = await getMyProfile(token.access_token);

    const tokenData = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      tokenScope: token.scope,
      isConnected: true,
      connectedAt: new Date(),
      disconnectedAt: null,
      userId: session.userId,
    };

    await prisma.socialAccount.upsert({
      where: {
        platform_platformAccountId: {
          platform: "linkedin",
          platformAccountId: profile.sub,
        },
      },
      create: {
        platform: "linkedin",
        platformAccountId: profile.sub,
        accountType: "personal",
        displayName: profile.name,
        username: profile.email,
        avatarUrl: profile.picture ?? null,
        ...tokenData,
      },
      update: {
        displayName: profile.name,
        username: profile.email,
        avatarUrl: profile.picture ?? null,
        ...tokenData,
      },
    });

    let administeredOrgs: Awaited<ReturnType<typeof getAdministeredOrgs>> = [];
    try {
      administeredOrgs = await getAdministeredOrgs(token.access_token);
    } catch (orgError) {
      console.warn("Could not fetch administered orgs:", orgError);
    }

    for (const org of administeredOrgs) {
      await prisma.socialAccount.upsert({
        where: {
          platform_platformAccountId: {
            platform: "linkedin",
            platformAccountId: org.organizationUrn,
          },
        },
        create: {
          platform: "linkedin",
          platformAccountId: org.organizationUrn,
          accountType: "company_page",
          displayName: org.name,
          avatarUrl: org.logoUrl ?? null,
          ...tokenData,
        },
        update: {
          displayName: org.name,
          avatarUrl: org.logoUrl ?? null,
          ...tokenData,
        },
      });
    }

    const response = redirect("/social?connected=linkedin");

    response.cookies.set("li_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("li_org_app", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("LinkedIn callback error:", err);
    return redirect("/social?error=linkedin_auth_failed");
  }
}
