"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/lib/deal-files-shared";

/**
 * Sprint 2 / 3.3 — Deal Files tab.
 *
 * Renders the DealFile attachments for a deal with three affordances:
 *   1. Upload a local file (≤ 10 MB) — pushed to Google Drive via the
 *      service account in POST /api/deals/[id]/files.
 *   2. Paste a Google Drive URL — resolved to a Drive file ID and linked
 *      via POST /api/deals/[id]/files/drive.
 *   3. Per-file actions: open in Drive, toggle searchability (uploads
 *      only — Drive-link rows are searched through the Drive corpus
 *      pipeline elsewhere), delete.
 *
 * Auto-discovered Drive corpus files (the legacy `deal.driveFiles`
 * relation populated by the Drive sync) render in a separate collapsed
 * section below — they're FYI, not user-managed attachments.
 */

type DealFile = {
  id: string;
  dealId: string;
  uploaderId: string | null;
  kind: "upload" | "drive_link";
  name: string;
  description: string | null;
  mimeType: string;
  size: string | null;
  driveFileId: string | null;
  driveWebViewLink: string | null;
  driveThumbnailLink: string | null;
  driveIconLink: string | null;
  driveModifiedTime: string | null;
  searchable: boolean;
  extractionStatus: "not_requested" | "pending" | "indexed" | "failed" | "skipped";
  extractedAt: string | null;
  extractionError: string | null;
  extractedTextHash: string | null;
  createdAt: string;
  updatedAt: string;
};

type RelatedDriveFile = {
  id: string;
  googleFileId: string;
  name: string;
  mimeType: string;
  size: string | null;
  webViewLink: string | null;
  thumbnailLink: string | null;
  iconLink: string | null;
  createdTime: string | null;
  modifiedTime: string | null;
};

interface DealFilesTabProps {
  dealId: string;
  initialDealFiles: DealFile[];
  relatedDriveFiles: RelatedDriveFile[];
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_MB = 10;

function extractionLabel(file: DealFile): string | null {
  if (!file.searchable) return null;
  switch (file.extractionStatus) {
    case "pending":
      return "Indexing queued";
    case "running":
      return "Indexing…";
    case "completed":
      return "Searchable";
    case "failed":
      return `Indexing failed${file.extractionError ? `: ${file.extractionError}` : ""}`;
    case "skipped":
      return "Not extractable (unsupported file type)";
    default:
      return null;
  }
}

function fileTypeIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "Sheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "Slides";
  if (mimeType.includes("document") || mimeType.includes("word")) return "Doc";
  if (mimeType.includes("image")) return "Image";
  if (mimeType.includes("video")) return "Video";
  if (mimeType.includes("audio")) return "Audio";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "Zip";
  if (mimeType.startsWith("text/")) return "Text";
  return "File";
}

export function DealFilesTab({ dealId, initialDealFiles, relatedDriveFiles }: DealFilesTabProps) {
  const router = useRouter();
  const [files, setFiles] = useState<DealFile[]>(initialDealFiles);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadSearchable, setUploadSearchable] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Drive link state
  const [driveLinkUrl, setDriveLinkUrl] = useState("");
  const [linkingDrive, setLinkingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const [showRelated, setShowRelated] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file later
    if (!f) return;

    setUploadError(null);

    if (f.size === 0) {
      setUploadError("That file is empty.");
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setUploadError(
        `File is ${formatBytes(f.size)} — over the ${MAX_UPLOAD_MB} MB cap. Paste a Google Drive link instead for anything larger.`
      );
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      form.append("searchable", uploadSearchable ? "true" : "false");
      const resp = await fetch(`/api/deals/${dealId}/files`, {
        method: "POST",
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) {
        setUploadError(data.error || `Upload failed (HTTP ${resp.status})`);
        return;
      }
      setFiles((prev) => [data.file as DealFile, ...prev]);
      startTransition(() => router.refresh());
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDriveLink() {
    setDriveError(null);
    const url = driveLinkUrl.trim();
    if (!url) {
      setDriveError("Paste a Google Drive URL first.");
      return;
    }
    setLinkingDrive(true);
    try {
      const resp = await fetch(`/api/deals/${dealId}/files/drive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setDriveError(data.error || `Link failed (HTTP ${resp.status})`);
        return;
      }
      const newFile = data.file as DealFile;
      // Idempotent endpoint may return an existing file — dedup on id.
      setFiles((prev) => {
        if (prev.some((f) => f.id === newFile.id)) return prev;
        return [newFile, ...prev];
      });
      setDriveLinkUrl("");
      startTransition(() => router.refresh());
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : "Link failed");
    } finally {
      setLinkingDrive(false);
    }
  }

  async function handleToggleSearchable(file: DealFile) {
    if (file.kind === "drive_link") return; // Drive-link rows aren't searchable here
    setBusyFileId(file.id);
    try {
      const next = !file.searchable;
      const resp = await fetch(`/api/deals/${dealId}/files/${file.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ searchable: next }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || `Update failed (HTTP ${resp.status})`);
        return;
      }
      setFiles((prev) => prev.map((f) => (f.id === file.id ? (data.file as DealFile) : f)));
    } finally {
      setBusyFileId(null);
    }
  }

  async function handleDelete(file: DealFile) {
    const label = file.kind === "drive_link" ? "remove this Drive link" : "delete this file (also removes it from Drive)";
    if (!confirm(`Are you sure you want to ${label}?`)) return;
    setBusyFileId(file.id);
    try {
      const resp = await fetch(`/api/deals/${dealId}/files/${file.id}`, {
        method: "DELETE",
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        alert(data.error || `Delete failed (HTTP ${resp.status})`);
        return;
      }
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      startTransition(() => router.refresh());
    } finally {
      setBusyFileId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add-file affordances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload card */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Upload a file</h3>
          <p className="text-xs text-gray-600 mb-3">
            Up to {MAX_UPLOAD_MB} MB. File is stored in Google Drive under the OpticWise service-account&apos;s Drive (folder: <span className="font-mono">OWnet Deal Files</span>). For anything bigger, paste a Drive link instead.
          </p>
          <label className="flex items-center gap-2 mb-3 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={uploadSearchable}
              onChange={(e) => setUploadSearchable(e.target.checked)}
              disabled={uploading}
            />
            Make this searchable by the OWnet agent (extract text, index for vector search)
          </label>
          <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${uploading ? "bg-gray-300 text-gray-500" : "bg-[#3B6B8F] text-white hover:bg-[#2f5572]"}`}>
            {uploading ? "Uploading…" : "Choose file"}
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          {uploadError && (
            <p className="mt-2 text-xs text-red-600">{uploadError}</p>
          )}
        </div>

        {/* Paste link card */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Paste a Google Drive link</h3>
          <p className="text-xs text-gray-600 mb-3">
            For files already in Drive — no upload needed. The OpticWise service account must have access to the file (share it with <span className="font-mono">opticwise-service@opticwise-integration-nbrain.iam.gserviceaccount.com</span> or place it in a shared folder OWnet already sees).
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={driveLinkUrl}
              onChange={(e) => setDriveLinkUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/…"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
              disabled={linkingDrive}
            />
            <button
              type="button"
              onClick={handleDriveLink}
              disabled={linkingDrive || driveLinkUrl.trim().length === 0}
              className={`px-3 py-2 rounded-md text-sm font-medium ${linkingDrive || driveLinkUrl.trim().length === 0 ? "bg-gray-300 text-gray-500" : "bg-[#3B6B8F] text-white hover:bg-[#2f5572]"}`}
            >
              {linkingDrive ? "Linking…" : "Link"}
            </button>
          </div>
          {driveError && <p className="mt-2 text-xs text-red-600">{driveError}</p>}
        </div>
      </div>

      {/* Deal file list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Attached files <span className="text-gray-400 font-normal">({files.length})</span>
        </h3>

        {files.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
            No files attached yet. Upload one or paste a Drive link above.
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const ext = extractionLabel(file);
              const isUpload = file.kind === "upload";
              return (
                <div
                  key={file.id}
                  className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-100 rounded text-[10px] font-medium text-gray-700 uppercase">
                    {fileTypeIcon(file.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{isUpload ? "Uploaded" : "Drive link"}</span>
                          <span>•</span>
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                          {ext && (
                            <>
                              <span>•</span>
                              <span className={file.extractionStatus === "failed" ? "text-red-600" : "text-gray-500"}>
                                {ext}
                              </span>
                            </>
                          )}
                        </div>
                        {file.description && (
                          <div className="text-xs text-gray-600 mt-1">{file.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {file.driveWebViewLink && (
                          <a
                            href={file.driveWebViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#3B6B8F] hover:underline px-2 py-1"
                          >
                            Open
                          </a>
                        )}
                        {isUpload && (
                          <button
                            type="button"
                            onClick={() => handleToggleSearchable(file)}
                            disabled={busyFileId === file.id}
                            className={`text-xs px-2 py-1 rounded border ${file.searchable ? "border-[#3B6B8F] text-[#3B6B8F] bg-blue-50" : "border-gray-300 text-gray-600 hover:bg-gray-50"} ${busyFileId === file.id ? "opacity-50 cursor-wait" : ""}`}
                            title={file.searchable ? "Click to stop indexing for agent search" : "Click to index for agent search"}
                          >
                            {file.searchable ? "Indexed" : "Index"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(file)}
                          disabled={busyFileId === file.id}
                          className={`text-xs text-red-600 hover:underline px-2 py-1 ${busyFileId === file.id ? "opacity-50 cursor-wait" : ""}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Related Drive corpus files (auto-discovered) */}
      {relatedDriveFiles.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setShowRelated((v) => !v)}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2"
          >
            <span>{showRelated ? "▼" : "▶"}</span>
            Related Drive files (auto-discovered) — {relatedDriveFiles.length}
          </button>
          {showRelated && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500">
                Files OWnet found via the Drive corpus sync that mention this deal. These aren&apos;t attached to the deal — to attach one, paste its Drive link above.
              </p>
              {relatedDriveFiles.map((rf) => (
                <a
                  key={rf.id}
                  href={rf.webViewLink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded text-[10px] font-medium text-gray-600 uppercase">
                    {fileTypeIcon(rf.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">{rf.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {formatBytes(rf.size)}
                      {rf.modifiedTime && ` • Modified ${new Date(rf.modifiedTime).toLocaleDateString()}`}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
