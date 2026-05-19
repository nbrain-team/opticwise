"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "sales", label: "Sales" },
  { value: "client", label: "Client" },
  { value: "internal", label: "Internal" },
  { value: "vendor", label: "Vendor" },
  { value: "executives", label: "Executives" },
  { value: "ppp_podcast", label: "PPP Podcast" },
  { value: "other", label: "Other" },
] as const;

interface Props {
  meetingId: string;
  currentCategory: string;
  currentConfidence: number | null;
  currentReason: string | null;
}

export function CategoryPicker({
  meetingId,
  currentCategory,
  currentConfidence,
  currentReason,
}: Props) {
  const router = useRouter();
  const [category, setCategory] = useState(currentCategory);
  const [saving, setSaving] = useState(false);
  const [confidence, setConfidence] = useState(currentConfidence);
  const [reason, setReason] = useState(currentReason);

  async function handleChange(newCategory: string) {
    if (newCategory === category) return;
    setSaving(true);
    try {
      const resp = await fetch(
        `/api/meeting-transcripts/${meetingId}/assign`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ category: newCategory }),
        }
      );
      if (resp.ok) {
        setCategory(newCategory);
        setConfidence(1.0);
        setReason("Manually set by user");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const isManual = reason === "Manually set by user";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={category}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="text-xs font-medium px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-[#3B6B8F] capitalize cursor-pointer disabled:opacity-50"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      {typeof confidence === "number" && !isManual && (
        <span className="text-xs text-gray-400">
          {Math.round(confidence * 100)}% confidence
        </span>
      )}
      {isManual && (
        <span className="text-xs text-gray-400 italic">manually set</span>
      )}
      {saving && <span className="text-xs text-gray-400">saving...</span>}
    </div>
  );
}
