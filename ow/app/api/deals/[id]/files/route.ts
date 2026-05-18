import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  MAX_FILES_PER_DEAL_LISTING,
  MAX_UPLOAD_BYTES,
  isExtractableMime,
  serializeDealFile,
} from "@/lib/deal-files-shared";
import { uploadDealFileToDrive } from "@/lib/deal-files-drive";

/**
 * Sprint 2 / 3.3 — Files on deals (upload + list).
 *
 * GET  /api/deals/[id]/files          — list every DealFile attached to the deal
 * POST /api/deals/[id]/files          — multipart upload of a single file
 *                                       (≤ 10 MB; bigger uses /drive sibling)
 *
 * Storage (Bill, 2026-05-18): every upload is pushed into Google Drive via
 * the existing service-account credentials (see `lib/google.ts` +
 * `lib/deal-files.ts#uploadDealFileToDrive`). The DealFile row stores the
 * resulting `driveFileId` + metadata; the legacy `content` bytea column is
 * NOT written to for new rows.
 *
 * The "Drive link" path lives at `/api/deals/[id]/files/drive` to keep the
 * multipart vs JSON parsing concerns split.
 */

async function requireSession() {
  const session = await getSession();
  if (!session) return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
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

  const files = await prisma.dealFile.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    take: MAX_FILES_PER_DEAL_LISTING,
  });

  return NextResponse.json({ files: files.map(serializeDealFile) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: dealId } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, title: true },
  });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with a `file` field" },
      { status: 400 }
    );
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: "Missing `file` field in multipart body" },
      { status: 400 }
    );
  }
  const file = fileEntry;

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `File exceeds the 10 MB upload cap. Paste a Google Drive link instead for anything larger.`,
        bytes: file.size,
        cap: MAX_UPLOAD_BYTES,
      },
      { status: 413 }
    );
  }

  const description =
    (formData.get("description") as string | null)?.trim() || null;
  const searchableFlag = formData.get("searchable") === "true";

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  const mimeType = file.type || "application/octet-stream";
  const name = file.name || "untitled";

  // If the user opts in to searchability AND the mime is supported we mark
  // it `pending` for the extraction worker; if unsupported we mark `skipped`
  // immediately so the UI surfaces the reason without firing the worker.
  let extractionStatus:
    | "not_requested"
    | "pending"
    | "skipped" = "not_requested";
  if (searchableFlag) {
    extractionStatus = isExtractableMime(mimeType) ? "pending" : "skipped";
  }

  // Push the file to Drive first; only persist the DealFile row once we have
  // a confirmed drive file ID so the DB never holds an "orphaned" upload row
  // pointing at a non-existent file.
  let driveResult;
  try {
    driveResult = await uploadDealFileToDrive({
      buffer: buf,
      filename: name,
      mimeType,
      dealTitle: deal.title,
    });
  } catch (err) {
    const isScopeIssue =
      err instanceof Error && (err as Error & { code?: string }).code === "INSUFFICIENT_SCOPES";
    const message = err instanceof Error ? err.message : String(err);
    console.error("Deal file upload to Drive failed:", message);
    return NextResponse.json(
      {
        error: isScopeIssue
          ? "OWnet couldn't upload to Google Drive — the service account is missing the 'drive.file' write scope. Ask Danny to authorize that scope on the service account's domain-wide delegation in Google Workspace admin."
          : `Drive upload failed: ${message}`,
      },
      { status: isScopeIssue ? 502 : 500 }
    );
  }

  const created = await prisma.dealFile.create({
    data: {
      dealId,
      uploaderId: session.userId,
      kind: "upload",
      name, // keep the original filename for display, not the Drive-decorated name
      description,
      mimeType: driveResult.mimeType,
      size: driveResult.size !== null ? BigInt(driveResult.size) : BigInt(file.size),
      // Bytea column is intentionally NOT populated for new rows — the file
      // bytes live in Drive. Legacy rows created before 2026-05-18 may still
      // have `content` populated; the download route handles both.
      content: null,
      driveFileId: driveResult.driveFileId,
      driveWebViewLink: driveResult.webViewLink,
      driveThumbnailLink: driveResult.thumbnailLink,
      driveIconLink: driveResult.iconLink,
      driveModifiedTime: driveResult.modifiedTime,
      searchable: searchableFlag,
      extractionStatus,
    },
  });

  return NextResponse.json(
    { file: serializeDealFile(created) },
    { status: 201 }
  );
}
