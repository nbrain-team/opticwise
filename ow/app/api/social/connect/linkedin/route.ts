import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildAuthUrl } from "@/lib/linkedin-api";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let includeOrgScopes = true;
    try {
      const body = await req.json();
      if (body.includeOrgScopes === false) includeOrgScopes = false;
    } catch {
      // empty body is fine — org scopes included by default
    }

    const state = crypto.randomBytes(32).toString("hex");

    const redirectUri = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://ownet.opticwise.com"
    }/api/social/callback/linkedin`;

    const authUrl = buildAuthUrl({
      redirectUri,
      state,
      includeOrgScopes,
    });

    const response = NextResponse.json({ authUrl });

    response.cookies.set("li_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error("LinkedIn connect error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate LinkedIn connection",
      },
      { status: 500 }
    );
  }
}
