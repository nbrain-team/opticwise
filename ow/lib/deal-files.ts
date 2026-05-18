/**
 * Sprint 2 / 3.3 — Deal file utility helpers.
 *
 * Shared constants and helpers used by `/api/deals/[id]/files/**` routes
 * and the Files tab UI. Centralized here so the 10 MB cap, supported
 * extraction mime types, and serialization shape stay consistent.
 */

import type { DealFile } from "@prisma/client";

/** 10 MB hard cap per uploaded file. Larger files: paste a Drive link. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Maximum number of files per deal we'll render in the UI by default. */
export const MAX_FILES_PER_DEAL_LISTING = 200;

/** Mime types we can extract text from for opt-in vector search. */
export const EXTRACTABLE_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc (legacy; best-effort)
  "text/plain",
  "text/markdown",
  "text/csv",
]);

export function isExtractableMime(mime: string): boolean {
  return EXTRACTABLE_MIME_TYPES.has(mime);
}

/**
 * Strip the bytea `content` blob from a DealFile when serializing for the
 * client. We never want to send the raw file bytes in a list response — the
 * client uses the download endpoint instead.
 */
export type SerializedDealFile = Omit<DealFile, "content" | "size"> & {
  size: string | null; // BigInt serialized as decimal string
};

export function serializeDealFile(file: DealFile): SerializedDealFile {
  // ESLint allows unused destructuring rest via _.
  const { content: _content, size, ...rest } = file;
  void _content;
  return {
    ...rest,
    size: size === null ? null : size.toString(),
  };
}

/**
 * Parse a Google Drive URL and return the file ID, or null if the URL
 * doesn't look like a Drive file we can resolve. Handles the common formats:
 *   - https://drive.google.com/file/d/<id>/view
 *   - https://drive.google.com/open?id=<id>
 *   - https://drive.google.com/uc?id=<id>&export=download
 *   - https://docs.google.com/{document,spreadsheets,presentation}/d/<id>/edit
 *   - https://drive.google.com/drive/folders/<id>
 */
export function parseDriveFileIdFromUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!host.endsWith("google.com")) return null;

  // /file/d/<id>/  or  /document/d/<id>/  or  /spreadsheets/d/<id>/  etc.
  const dPathMatch = url.pathname.match(
    /\/(?:file|document|spreadsheets|presentation|drawings|forms)\/d\/([^/]+)/
  );
  if (dPathMatch) return dPathMatch[1];

  // /drive/folders/<id>
  const folderMatch = url.pathname.match(/\/drive\/folders\/([^/]+)/);
  if (folderMatch) return folderMatch[1];

  // ?id=<id>  (legacy /open and /uc URLs)
  const idQuery = url.searchParams.get("id");
  if (idQuery) return idQuery;

  return null;
}

/**
 * Friendly bytes formatter for the Files tab — matches "10 MB" style we use
 * in the upload error copy.
 */
export function formatBytes(bytes: number | bigint | string | null): string {
  if (bytes === null) return "—";
  const n = typeof bytes === "bigint" ? Number(bytes) : Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
