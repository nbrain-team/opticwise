import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Stubbed here — the full classifier is built in Phase 2a (lib/social-risk-classifier.ts).
// This route delegates to it once available.

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { content, platform, accountType } = body as {
    content?: string;
    platform?: string;
    accountType?: string;
  };

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  // Phase 2a will replace this with a real classifier import.
  // For now, return low-risk as a placeholder.
  return NextResponse.json({
    tier: "low",
    reasons: [],
    note: "Risk classifier not yet implemented — defaulting to low",
  });
}
