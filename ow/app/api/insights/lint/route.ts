import { NextRequest, NextResponse } from "next/server";
import { requireEditor } from "@/lib/require-editor";
import { lintInsightMarkdownLite } from "@/lib/insights/sb7-linter";

export async function POST(req: NextRequest) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const html = typeof body.html === "string" ? body.html : "";
  const lint = lintInsightMarkdownLite(html);
  return NextResponse.json(lint);
}
