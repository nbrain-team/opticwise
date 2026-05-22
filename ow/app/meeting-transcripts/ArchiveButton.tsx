"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArchiveButton({
  meetingId,
  isArchived,
}: {
  meetingId: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleArchive() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/meeting-transcripts/${meetingId}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archive: !isArchived }),
        }
      );
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleArchive}
          disabled={loading}
          className="px-2 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Confirm"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-500"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => (isArchived ? handleArchive() : setShowConfirm(true))}
      disabled={loading}
      title={isArchived ? "Restore from archive" : "Archive this transcript"}
      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${
        isArchived
          ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
          : "border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
      }`}
    >
      {loading ? (
        "…"
      ) : isArchived ? (
        <span className="flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          Restore
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          Archive
        </span>
      )}
    </button>
  );
}
