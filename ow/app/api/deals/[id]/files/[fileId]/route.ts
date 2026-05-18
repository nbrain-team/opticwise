import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isExtractableMime, serializeDealFile } from "@/lib/deal-files";
import { getDriveClient, getServiceAccountClient } from "@/lib/google";

/**
 * Sprint 2 / 3.3 — per-file actions on a deal attachment.
 *
 * GET    /api/deals/[id]/files/[fileId]    — stream the bytea content as a
 *                                             download (only for kind=upload;
 *                                             drive_link rows redirect to
 *                                             their `driveWebViewLink`).
 * PATCH  /api/deals/[id]/files/[fileId]    — update `searchable` flag and/or
 *                                             `description`. When searchable
 *                                             flips:
 *                                               false → true: status =
 *                                                 pending (or skipped when
 *                                                 mime is unsupported).
 *                                               true → false: status =
 *                                                 not_requested AND any
 *                                                 existing DealAttachmentChunk
 *                                                 rows are deleted so the
 *                                                 agent stops surfacing them.
 * DELETE /api/deals/[id]/files/[fileId]    — hard-delete the row. Chunks
 *                                             cascade automatically.
 */

async function loadFile(dealId: string, fileId: string) {
  return prisma.dealFile.findFirst({
    where: { id: fileId, dealId },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: dealId, fileId } = await params;

  const file = await loadFile(dealId, fileId);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Both kinds — upload and drive_link — store the file in Google Drive as
  // of 2026-05-18. Prefer the Drive web-view link in both cases. The bytea
  // content branch below is a fallback for legacy `upload` rows created
  // before the Drive pivot.
  if (file.driveWebViewLink) {
    return NextResponse.redirect(file.driveWebViewLink, 302);
  }

  if (file.kind === "drive_link") {
    return NextResponse.json(
      { error: "Drive link has no webViewLink to redirect to" },
      { status: 404 }
    );
  }

  // Legacy fallback: kind = upload + content bytea (pre-2026-05-18 rows).
  if (!file.content) {
    return NextResponse.json(
      { error: "File has no content (data missing)" },
      { status: 500 }
    );
  }

  const filename = encodeURIComponent(file.name || "file");
  return new NextResponse(new Uint8Array(file.content), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Length": String(file.size ?? file.content.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: dealId, fileId } = await params;

  const file = await loadFile(dealId, fileId);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  let body: { searchable?: unknown; description?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const updates: {
    searchable?: boolean;
    extractionStatus?:
      | "not_requested"
      | "pending"
      | "skipped";
    extractedAt?: Date | null;
    extractionError?: string | null;
    description?: string | null;
    name?: string;
  } = {};
  let chunkCleanup = false;

  if (typeof body.searchable === "boolean") {
    if (file.kind === "drive_link" && body.searchable) {
      return NextResponse.json(
        {
          error:
            "Drive-linked files are searched through the Drive corpus pipeline, not the deal attachment index.",
        },
        { status: 400 }
      );
    }
    updates.searchable = body.searchable;
    if (body.searchable && !file.searchable) {
      updates.extractionStatus = isExtractableMime(file.mimeType)
        ? "pending"
        : "skipped";
      updates.extractionError = null;
    } else if (!body.searchable && file.searchable) {
      updates.extractionStatus = "not_requested";
      updates.extractedAt = null;
      updates.extractionError = null;
      chunkCleanup = true;
    }
  }

  if (typeof body.description === "string") {
    const trimmed = body.description.trim();
    updates.description = trimmed.length > 0 ? trimmed : null;
  }
  if (typeof body.name === "string" && body.name.trim().length > 0) {
    updates.name = body.name.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No supported fields to update" },
      { status: 400 }
    );
  }

  // When the user is turning searchability OFF, drop the existing chunks
  // first (inside the same transaction as the update) so the agent stops
  // surfacing them instantly.
  const updated = await prisma.$transaction(async (tx) => {
    if (chunkCleanup) {
      await tx.dealAttachmentChunk.deleteMany({
        where: { dealFileId: file.id },
      });
    }
    return tx.dealFile.update({
      where: { id: file.id },
      data: updates,
    });
  });

  return NextResponse.json({ file: serializeDealFile(updated) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: dealId, fileId } = await params;

  const file = await loadFile(dealId, fileId);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // For uploads we own the Drive file (the service account created it), so
  // remove it from Drive too. For drive_link rows the file belongs to whoever
  // shared it — we never touch the source.
  let driveCleanupError: string | null = null;
  if (file.kind === "upload" && file.driveFileId) {
    try {
      const drive = await getDriveClient(getServiceAccountClient());
      await drive.files.delete({
        fileId: file.driveFileId,
        supportsAllDrives: true,
      });
    } catch (err) {
      // Surface but don't block — better to delete the DB row than to leak
      // a row when Drive returns a transient error.
      driveCleanupError =
        err instanceof Error ? err.message : "Unknown Drive error";
      console.warn(
        `Drive cleanup failed for DealFile ${file.id} (driveFileId=${file.driveFileId}): ${driveCleanupError}`
      );
    }
  }

  await prisma.dealFile.delete({ where: { id: file.id } });
  return NextResponse.json({
    ok: true,
    id: file.id,
    ...(driveCleanupError ? { warning: `Drive cleanup failed: ${driveCleanupError}` } : {}),
  });
}
