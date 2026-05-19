"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  uncategorizedCount: number;
}

export function BackfillCategoriesButton({ uncategorizedCount }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    processed: number;
    errors: number;
    results?: Array<{ title: string; category: string; confidence: number }>;
  } | null>(null);

  if (uncategorizedCount === 0 && !result) return null;

  async function handleRun() {
    setRunning(true);
    setResult(null);
    try {
      const resp = await fetch("/api/meeting-transcripts/backfill-categories", {
        method: "POST",
      });
      const data = await resp.json();
      setResult(data);
      router.refresh();
    } catch {
      setResult({ processed: 0, errors: 1 });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-amber-800">
            {uncategorizedCount} meeting{uncategorizedCount !== 1 ? "s" : ""} uncategorized
          </h3>
          <p className="text-xs text-amber-600 mt-0.5">
            Run the AI classifier to auto-categorize historical meetings
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running || uncategorizedCount === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {running ? "Classifying..." : "Run Backfill"}
        </button>
      </div>

      {result && (
        <div className="mt-3 text-xs">
          <p className="text-amber-800 font-medium">
            Classified {result.processed} meeting{result.processed !== 1 ? "s" : ""}
            {result.errors > 0 ? `, ${result.errors} error${result.errors !== 1 ? "s" : ""}` : ""}
          </p>
          {result.results && result.results.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-amber-700">
                  <span className="inline-flex px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 capitalize">
                    {r.category.replace(/_/g, " ")}
                  </span>
                  <span className="text-amber-500">{Math.round(r.confidence * 100)}%</span>
                  <span className="truncate">{r.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
