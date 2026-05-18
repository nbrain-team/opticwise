import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getDriveClient, getServiceAccountClient } from "@/lib/google";
import {
  parseDriveFileIdFromUrl,
  serializeDealFile,
} from "@/lib/deal-files";

/**
 * Sprint 2 / 3.3 — Link a Google Drive file to a deal.
 *
 * POST /api/deals/[id]/files/drive
 * Body: { url: string, description?: string }
 *
 * Per Bill's 2026-05-18 direction we reuse the existing service-account
 * Google client from `lib/google.ts` (already used for Gmail / Calendar /
 * Drive corpus sync) to resolve the URL → file ID, fetch metadata, and
 * persist it as a `DealFile` with kind = `drive_link`. The file's bytes
 * stay in Drive — we only store the reference + metadata snapshot.
 *
 * Errors handled:
 *   - URL doesn't look like Drive (400)
 *   - Drive returns 404 / 403 (service account can't see the file)
 *   - Duplicate drive link (idempotent — return the existing row, 200)
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: dealId } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true },
  });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  let body: { url?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  if (typeof body.url !== "string" || body.url.trim().length === 0) {
    return NextResponse.json(
      { error: "`url` is required" },
      { status: 400 }
    );
  }
  const url = body.url.trim();
  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  const driveFileId = parseDriveFileIdFromUrl(url);
  if (!driveFileId) {
    return NextResponse.json(
      {
        error:
          "That doesn't look like a Google Drive URL. Expected something like https://drive.google.com/file/d/<id>/view",
      },
      { status: 400 }
    );
  }

  // Idempotent: if this deal already has a drive_link row pointing at the
  // same Google file ID, return it instead of creating a duplicate.
  const existing = await prisma.dealFile.findFirst({
    where: { dealId, kind: "drive_link", driveFileId },
  });
  if (existing) {
    return NextResponse.json({ file: serializeDealFile(existing) });
  }

  // Fetch metadata via the existing service-account client.
  let driveMeta: {
    id: string;
    name: string;
    mimeType: string;
    size?: string | null;
    modifiedTime?: string | null;
    webViewLink?: string | null;
    thumbnailLink?: string | null;
    iconLink?: string | null;
  };
  try {
    const auth = getServiceAccountClient();
    const drive = await getDriveClient(auth);
    const resp = await drive.files.get({
      fileId: driveFileId,
      fields:
        "id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,iconLink",
      supportsAllDrives: true,
    });
    driveMeta = resp.data as typeof driveMeta;
  } catch (err) {
    // Map common Drive errors to actionable messages.
    const message = err instanceof Error ? err.message : String(err);
    const isNotFound = /not\s*found|404/i.test(message);
    const isForbidden = /forbidden|403|permission/i.test(message);
    return NextResponse.json(
      {
        error:
          isNotFound
            ? "Drive couldn't find that file. Make sure the URL is correct."
            : isForbidden
              ? "OWnet's service account doesn't have access to that file. Share it with the OpticWise service account (or move it to a shared drive OWnet already has access to)."
              : `Drive request failed: ${message}`,
      },
      { status: isNotFound ? 404 : isForbidden ? 403 : 502 }
    );
  }

  const created = await prisma.dealFile.create({
    data: {
      dealId,
      uploaderId: session.userId,
      kind: "drive_link",
      name: driveMeta.name || "(untitled Drive file)",
      description,
      mimeType: driveMeta.mimeType || "application/octet-stream",
      size: driveMeta.size ? BigInt(driveMeta.size) : null,
      driveFileId: driveMeta.id,
      driveWebViewLink: driveMeta.webViewLink ?? null,
      driveThumbnailLink: driveMeta.thumbnailLink ?? null,
      driveIconLink: driveMeta.iconLink ?? null,
      driveModifiedTime: driveMeta.modifiedTime
        ? new Date(driveMeta.modifiedTime)
        : null,
      // Drive-linked files can't be searched by us — searchability of Drive
      // content already happens through the corpus pipeline using the
      // existing DriveFile model. We leave this off for kind=drive_link.
      searchable: false,
      extractionStatus: "not_requested",
    },
  });

  return NextResponse.json(
    { file: serializeDealFile(created) },
    { status: 201 }
  );
}
