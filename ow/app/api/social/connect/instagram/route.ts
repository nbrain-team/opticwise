import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildInstagramAuthUrl } from "@/lib/instagram-api";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ownet.opticwise.com";
  const redirectUri = `${appUrl}/api/social/callback/instagram`;

  const authUrl = buildInstagramAuthUrl({ redirectUri, state });

  const response = NextResponse.json({ authUrl });
  response.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
