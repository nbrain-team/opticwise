import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireEditor } from "@/lib/require-editor";
import type { InsightAssetKind } from "@prisma/client";

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 180) || "image.bin";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const { id } =await params;
  const row = await prisma.insight.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const kindRaw = String(form.get("kind") || "inline");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!["hero", "inline", "og"].includes(kindRaw)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const kind = kindRaw as InsightAssetKind;

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 400 });
  }

  const sha256 = createHash("sha256").update(buf).digest("hex");
  const filename = safeName(file.name || "upload");

  if (kind === "hero") {
    await prisma.insightAsset.deleteMany({
      where: { insightId: id, kind: "hero" },
    });
  }

  const asset = await prisma.insightAsset.create({
    data: {
      insightId: id,
      filename,
      mimeType: file.type || "application/octet-stream",
      bytes: buf,
      sha256,
      kind,
    },
  });

  const url = `/api/insights/${id}/assets/${asset.id}`;

  return NextResponse.json({
    asset: { id: asset.id, filename: asset.filename, kind: asset.kind, url },
  });
}
