"use client";

import { useState } from "react";
import Link from "next/link";

interface BlogPackage {
  slug: string;
  moat: string;
  blog: {
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    readingTime: number;
    category: string;
    tags: string[];
    seoTitle: string;
    seoDescription: string;
    featureImagePrompt: string;
    ogImagePrompt: string;
  };
  linkedinArticle: { title: string; body: string };
  linkedinPost: { title: string; body: string };
  canonAdherence: { score: number; failures: string[] };
}

interface RunResult {
  date: string;
  sourcesUsed: number;
  trends: Array<{
    author: "Bill" | "Drew";
    title: string;
    argument: string;
    moat: string;
    sources: Array<{ title: string; url?: string; sender: string }>;
  }>;
  packages: BlogPackage[];
  briefing: { title: string; body: string };
  summary: { title: string; body: string };
  drivePayload: Record<string, unknown>;
  driveResult?: { ok: boolean; status?: number; error?: string };
}

export default function ContentEnginePage() {
  const [labelQuery, setLabelQuery] = useState("label:2day-wd-inbox-2day-wd-read");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [moat, setMoat] = useState("");
  const [postToDrive, setPostToDrive] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [tab, setTab] = useState<"trends" | "packages" | "briefing" | "summary" | "drive">("trends");

  const runEngine = async (dryRun: boolean) => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/content-engine/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          labelQuery,
          preferredMoat: moat || undefined,
          postToDrive: dryRun ? false : postToDrive,
          dryRun,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.details || "Run failed");
      if (dryRun) {
        setError(null);
        alert(`Dry run OK. ${data.sourcesLoaded} sources found.`);
      } else {
        setResult(data as RunResult);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Content Engine</h1>
            <p className="text-slate-600 text-sm mt-1">
              Weekly OpticWise content workflow — inbox → trends → Bill + Drew packages → Drive Bridge
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <section className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Run date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded border-slate-300 shadow-sm text-sm px-3 py-2 border"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Gmail label query</span>
              <input
                type="text"
                value={labelQuery}
                onChange={(e) => setLabelQuery(e.target.value)}
                className="mt-1 block w-full rounded border-slate-300 shadow-sm text-sm px-3 py-2 border font-mono"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Preferred moat (optional)</span>
              <select
                value={moat}
                onChange={(e) => setMoat(e.target.value)}
                className="mt-1 block w-full rounded border-slate-300 shadow-sm text-sm px-3 py-2 border"
              >
                <option value="">— infer —</option>
                <option value="data">Data</option>
                <option value="workflows">Workflows</option>
                <option value="orchestration">Orchestration</option>
                <option value="operating-standard">Operating standard</option>
              </select>
            </label>
            <label className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                checked={postToDrive}
                onChange={(e) => setPostToDrive(e.target.checked)}
              />
              <span className="text-sm text-slate-700">POST to Drive Bridge after generation</span>
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => runEngine(true)}
              disabled={running}
              className="px-4 py-2 rounded border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Dry run (load sources only)
            </button>
            <button
              onClick={() => runEngine(false)}
              disabled={running}
              className="px-4 py-2 rounded bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {running ? "Running…" : "Run full engine"}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}
        </section>

        {result && (
          <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-3 flex items-center gap-4 text-sm">
              <span className="text-slate-500">{result.sourcesUsed} sources · {result.packages.length} packages</span>
              <div className="flex-1" />
              {(["trends", "packages", "briefing", "summary", "drive"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded ${tab === t ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {tab === "trends" && (
                <div className="space-y-4">
                  {result.trends.map((t, i) => (
                    <div key={i} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wide text-slate-500">{t.author} · {t.moat}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{t.title}</h3>
                      <p className="text-sm text-slate-700 mb-3">{t.argument}</p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {t.sources.map((s, j) => (
                          <li key={j}>· {s.title} ({s.sender}){s.url ? ` — ${s.url}` : ""}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {tab === "packages" && (
                <div className="space-y-6">
                  {result.packages.map((p, i) => (
                    <div key={i} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{p.blog.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${p.canonAdherence.score >= 80 ? "bg-green-100 text-green-800" : p.canonAdherence.score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                          Canon {p.canonAdherence.score}/100
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-3">slug: {p.slug} · moat: {p.moat} · category: {p.blog.category} · tags: {p.blog.tags.join(", ")}</div>
                      <div className="text-sm text-slate-700 italic mb-4">{p.blog.excerpt}</div>
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-slate-700">Blog body ({p.blog.readingTime} min read)</summary>
                        <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 p-4 rounded border">{p.blog.body}</pre>
                      </details>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-slate-700">LinkedIn article — {p.linkedinArticle.title}</summary>
                        <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 p-4 rounded border">{p.linkedinArticle.body}</pre>
                      </details>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-slate-700">LinkedIn short post</summary>
                        <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 p-4 rounded border">{p.linkedinPost.body}</pre>
                      </details>
                      {p.canonAdherence.failures.length > 0 && (
                        <div className="mt-3 text-xs text-red-700">
                          Failures: {p.canonAdherence.failures.join(" · ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {tab === "briefing" && (
                <pre className="whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 p-4 rounded border">{result.briefing.body}</pre>
              )}
              {tab === "summary" && (
                <pre className="whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 p-4 rounded border">{result.summary.body}</pre>
              )}
              {tab === "drive" && (
                <div>
                  {result.driveResult && (
                    <div className={`mb-3 p-3 rounded text-sm ${result.driveResult.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                      Drive Bridge: {result.driveResult.ok ? "OK" : "FAILED"}
                      {result.driveResult.status ? ` (${result.driveResult.status})` : ""}
                      {result.driveResult.error ? ` — ${result.driveResult.error}` : ""}
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 bg-slate-50 p-4 rounded border">{JSON.stringify(result.drivePayload, null, 2)}</pre>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
