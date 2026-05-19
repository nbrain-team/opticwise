import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { classifyRisk } from "@/lib/social-risk-classifier";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { content, platform, accountType, accountDisplayName } = body as {
    content?: string;
    platform?: "linkedin" | "instagram";
    accountType?: string;
    accountDisplayName?: string;
  };

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const result = await classifyRisk({
    content,
    platform: platform || "linkedin",
    accountType: accountType || "personal",
    accountDisplayName,
  });

  return NextResponse.json(result);
}
