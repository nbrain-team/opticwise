import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import * as cheerio from "cheerio";
import { requireEditor } from "@/lib/require-editor";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const row = await prisma.insight.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const { value: html } = await mammoth.convertToHtml({ buffer: buf });

  const $ = cheerio.load(html);
  $("script, style").remove();
  const cleaned = $("body").length ? $("body").html() || "" : $.html();

  return NextResponse.json({ html: cleaned });
}
