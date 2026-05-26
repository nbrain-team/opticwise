import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ensureFreshToken } from "@/lib/linkedin-api";

const LI_API_BASE = "https://api.linkedin.com";
const LI_API_VERSION = "202401";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mediaId = req.nextUrl.searchParams.get("mediaId");
    const accountId = req.nextUrl.searchParams.get("accountId");

    if (!mediaId || !accountId) {
      return NextResponse.json(
        { error: "mediaId and accountId are required" },
        { status: 400 }
      );
    }

    const accessToken = await ensureFreshToken(accountId);

    // Fetch image metadata from LinkedIn to get the download URL
    const encodedUrn = encodeURIComponent(mediaId);
    const resp = await fetch(`${LI_API_BASE}/rest/images/${encodedUrn}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": LI_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image metadata" },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const downloadUrl = data.downloadUrl || null;

    if (!downloadUrl) {
      return NextResponse.json({ error: "No download URL available" }, { status: 404 });
    }

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error("Media preview error:", error);
    return NextResponse.json(
      { error: "Failed to get media preview" },
      { status: 500 }
    );
  }
}
