/**
 * Sprint 2 / 3.3 — Deal file utility helpers.
 *
 * Shared constants and helpers used by `/api/deals/[id]/files/**` routes
 * and the Files tab UI. Centralized here so the 10 MB cap, supported
 * extraction mime types, and serialization shape stay consistent.
 *
 * Storage architecture (Bill, 2026-05-18):
 *   - All deal file payloads live in Google Drive, accessed via the existing
 *     `GOOGLE_SERVICE_ACCOUNT_JSON` credentials (already configured on the
 *     `opticwise-frontend` service).
 *   - The DealFile.kind field tracks PROVENANCE only:
 *       `upload`     → user uploaded a local file; OWnet pushed it into Drive
 *                      via the service account.
 *       `drive_link` → user pasted a Drive URL; OWnet only stored the
 *                      reference.
 *     Both kinds end up with `driveFileId` + `driveWebViewLink` populated,
 *     so the GET/download path is identical (redirect to webViewLink).
 *   - The legacy `content: Bytes?` column on DealFile is retained for
 *     backward-compat with rows created before 2026-05-18. It is never
 *     written to going forward, and the download endpoint falls back to
 *     streaming the blob only when both `driveWebViewLink` is null AND
 *     `content` is present (i.e., legacy rows).
 */

import "server-only";
import type { DealFile } from "@prisma/client";
import { Readable } from "stream";
import { getDriveClient, getServiceAccountClient } from "./google";

// Re-export client-safe helpers so existing server-side imports of
// `@/lib/deal-files` keep working. Client components should import from
// `@/lib/deal-files-shared` directly.
export {
  MAX_UPLOAD_BYTES,
  MAX_FILES_PER_DEAL_LISTING,
  EXTRACTABLE_MIME_TYPES,
  isExtractableMime,
  parseDriveFileIdFromUrl,
  formatBytes,
} from "./deal-files-shared";

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

// =============================================================
// Drive upload (Bill, 2026-05-18 direction — use the existing service
// account for deal file storage instead of bytea-in-Postgres).
// =============================================================

/**
 * Name of the root Drive folder under the impersonated user's My Drive
 * where every OWnet-uploaded deal file is parked. Kept stable so files can
 * be found via Drive search even outside OWnet.
 */
export const DEAL_FILES_ROOT_FOLDER_NAME = "OWnet Deal Files";

const FOLDER_MIME = "application/vnd.google-apps.folder";

/**
 * Find or create the OWnet root deal-files folder under the impersonated
 * user's My Drive. Idempotent — repeated calls return the same folder ID.
 *
 * Per-deal subfolders are intentionally NOT created: keeping files in a
 * single flat folder simplifies Drive UI browsing and the deal context is
 * already captured by `DealFile.dealId` in Postgres. The folder name in
 * Drive includes the deal title for visual scanning (e.g., "Acme Audit /
 * Jan 2026").
 */
async function findOrCreateDealFilesRoot(): Promise<string> {
  const drive = await getDriveClient(getServiceAccountClient());

  const escaped = DEAL_FILES_ROOT_FOLDER_NAME.replace(/'/g, "\\'");
  const search = await drive.files.list({
    q: `name = '${escaped}' and mimeType = '${FOLDER_MIME}' and trashed = false and 'me' in owners`,
    fields: "files(id,name)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const existing = search.data.files?.[0];
  if (existing?.id) return existing.id;

  const created = await drive.files.create({
    requestBody: {
      name: DEAL_FILES_ROOT_FOLDER_NAME,
      mimeType: FOLDER_MIME,
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const id = created.data.id;
  if (!id) {
    throw new Error("Drive returned no folder ID after creating root folder");
  }
  return id;
}

export type DriveUploadResult = {
  driveFileId: string;
  name: string;
  mimeType: string;
  size: number | null;
  webViewLink: string | null;
  thumbnailLink: string | null;
  iconLink: string | null;
  modifiedTime: Date | null;
};

/**
 * Upload a single file buffer into the OWnet deal-files Drive folder under
 * the impersonated user's account. Returns the metadata snapshot that the
 * caller persists onto the DealFile row.
 *
 * Naming convention: files are uploaded under their original filename,
 * prefixed with the deal title (when supplied) so the Drive UI is scannable.
 * Drive auto-disambiguates collisions by appending " (1)", " (2)", etc.,
 * which is fine because OWnet always references files by ID, not by name.
 *
 * Surfaces a structured error (with `code: 'INSUFFICIENT_SCOPES'`) when the
 * domain-wide-delegation config in Google Workspace admin hasn't yet
 * authorized `drive.file` — the route handler maps this to a 502 with
 * actionable copy.
 */
export async function uploadDealFileToDrive(args: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  dealTitle?: string | null;
}): Promise<DriveUploadResult> {
  const drive = await getDriveClient(getServiceAccountClient());
  const folderId = await findOrCreateDealFilesRoot();

  const displayName =
    args.dealTitle && args.dealTitle.trim().length > 0
      ? `${args.dealTitle.trim()} — ${args.filename}`
      : args.filename;

  let driveResp;
  try {
    driveResp = await drive.files.create({
      requestBody: {
        name: displayName,
        parents: [folderId],
        mimeType: args.mimeType,
      },
      media: {
        mimeType: args.mimeType,
        body: Readable.from(args.buffer),
      },
      fields:
        "id,name,mimeType,size,webViewLink,thumbnailLink,iconLink,modifiedTime",
      supportsAllDrives: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isScopeIssue = /insufficient|scope|permission/i.test(message);
    const tagged = new Error(
      isScopeIssue
        ? `Drive upload failed (insufficient scopes — the Google Workspace admin needs to authorize the 'drive.file' scope for the service account's domain-wide delegation). Original: ${message}`
        : `Drive upload failed: ${message}`
    ) as Error & { code?: string };
    if (isScopeIssue) tagged.code = "INSUFFICIENT_SCOPES";
    throw tagged;
  }

  const data = driveResp.data;
  if (!data.id) {
    throw new Error("Drive returned no file ID after upload");
  }

  return {
    driveFileId: data.id,
    name: data.name ?? args.filename,
    mimeType: data.mimeType ?? args.mimeType,
    size: data.size ? Number(data.size) : null,
    webViewLink: data.webViewLink ?? null,
    thumbnailLink: data.thumbnailLink ?? null,
    iconLink: data.iconLink ?? null,
    modifiedTime: data.modifiedTime ? new Date(data.modifiedTime) : null,
  };
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
