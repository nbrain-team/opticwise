"use client";

import { useState } from "react";

/**
 * Sprint 2 / 4.7 — Generate from transcript UI.
 *
 * Shows category-aware action buttons for a Read.ai meeting and renders
 * the generated artifact inline. Streaming + persistence are v2 follow-ups;
 * for v1 we POST → render markdown → offer copy-to-clipboard.
 */

type ActionDescriptor = {
  id: string;
  label: string;
  hint: string;
};

type Result = {
  action: string;
  title: string;
  content: string;
};

interface Props {
  meetingId: string;
  category: string;
  categoryReason: string | null;
  categoryConfidence: number | null;
  actions: ActionDescriptor[];
  /** When non-null, render a banner explaining why no actions are available. */
  emptyMessage?: string | null;
}

export function GenerateFromTranscript({
  meetingId,
  category,
  categoryReason,
  categoryConfidence,
  actions,
  emptyMessage,
}: Props) {
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run(action: ActionDescriptor) {
    setError(null);
    setRunningAction(action.id);
    setResult(null);
    setCopied(false);
    try {
      const resp = await fetch(
        `/api/meeting-transcripts/${meetingId}/generate`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: action.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || `Generation failed (HTTP ${resp.status})`);
        return;
      }
      setResult({ action: data.action, title: data.title, content: data.content });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setRunningAction(null);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers / no permission — fall back to a quick error.
      setError("Couldn't copy to clipboard. Select the text manually.");
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-[#2E2E2F]">
            Generate from transcript
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Category: <span className="font-medium capitalize">{category.replace(/_/g, " ")}</span>
            {typeof categoryConfidence === "number" && (
              <span className="text-gray-400"> · confidence {(categoryConfidence * 100).toFixed(0)}%</span>
            )}
          </p>
          {categoryReason && (
            <p className="text-xs text-gray-400 mt-0.5 italic max-w-md">{categoryReason}</p>
          )}
        </div>
      </div>

      {emptyMessage ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actions.map((a) => {
            const running = runningAction === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => run(a)}
                disabled={runningAction !== null}
                className={`text-left p-3 rounded-md border text-sm transition-colors ${
                  running
                    ? "border-[#3B6B8F] bg-blue-50 cursor-wait"
                    : runningAction !== null
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 hover:border-[#3B6B8F] hover:bg-blue-50/30"
                }`}
              >
                <div className="font-medium text-[#2E2E2F]">
                  {running ? `${a.label}…` : a.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{a.hint}</div>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">{result.title}</h3>
            <button
              type="button"
              onClick={copyToClipboard}
              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 border border-gray-200 rounded p-4 max-h-[500px] overflow-y-auto">
            {result.content}
          </pre>
        </div>
      )}
    </div>
  );
}
