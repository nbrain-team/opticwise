"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RichTextEmailEditor, {
  type RichTextEmailEditorHandle,
} from "@/app/forms/RichTextEmailEditor";

type InsightRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  category: string;
  secondaryCategories: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImagePath: string | null;
  authorSlug: string | null;
  datePublished: string | null;
  scheduledFor: string | null;
  status: string;
  topicClusterPaths: string[];
  assets: {
    id: string;
    filename: string;
    kind: string;
  }[];
};

export default function InsightEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const editorRef = useRef<RichTextEmailEditorHandle>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const inlineImgRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lint, setLint] = useState<string[]>([]);
  const [row, setRow] = useState<InsightRow | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [category, setCategory] = useState("");
  const [secondaryCategories, setSecondaryCategories] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [twitterTitle, setTwitterTitle] = useState("");
  const [twitterDescription, setTwitterDescription] = useState("");
  const [twitterImagePath, setTwitterImagePath] = useState("");
  const [authorSlug, setAuthorSlug] = useState("");
  const [datePublished, setDatePublished] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const [topicClusterPaths, setTopicClusterPaths] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/insights/${id}`);
    if (!res.ok) {
      if (res.status === 404) router.replace("/insights");
      setError("Could not load insight");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const r = data.insight as InsightRow;
    setRow(r);
    setTitle(r.title);
    setSlug(r.slug);
    setExcerpt(r.excerpt);
    setBodyHtml(r.bodyHtml);
    setCategory(r.category);
    setSecondaryCategories(r.secondaryCategories.join(", "));
    setSeoTitle(r.seoTitle ?? "");
    setSeoDescription(r.seoDescription ?? "");
    setTwitterTitle(r.twitterTitle ?? "");
    setTwitterDescription(r.twitterDescription ?? "");
    setTwitterImagePath(r.twitterImagePath ?? "");
    setAuthorSlug(r.authorSlug ?? "");
    setDatePublished(
      r.datePublished ? r.datePublished.slice(0, 16) : ""
    );
    setScheduledFor(
      r.scheduledFor ? new Date(r.scheduledFor).toISOString().slice(0, 16) : ""
    );
    setTopicClusterPaths(r.topicClusterPaths.join("\n"));
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function refreshLint(html: string) {
    const res = await fetch("/api/insights/lint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: `${title}\n${excerpt}\n${html}` }),
    });
    if (res.ok) {
      const d = await res.json();
      setLint(d.warnings || []);
    }
  }

  async function savePatch(extra: Record<string, unknown> = {}) {
    setSaving(true);
    setError(null);
    try {
      const sec = secondaryCategories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const tcp = topicClusterPaths
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title,
        slug,
        excerpt,
        bodyHtml,
        category,
        secondaryCategories: sec,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        twitterTitle: twitterTitle || null,
        twitterDescription: twitterDescription || null,
        twitterImagePath: twitterImagePath || null,
        authorSlug: authorSlug || null,
        topicClusterPaths: tcp,
        datePublished: datePublished
          ? new Date(datePublished).toISOString()
          : null,
        scheduledFor: scheduledFor
          ? new Date(scheduledFor).toISOString()
          : null,
        ...extra,
      };

      const res = await fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setRow(data.insight);
      if (data.lint?.warnings) setLint(data.lint.warnings);
      await refreshLint(bodyHtml);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onPublishNow() {
    await savePatch({ status: "draft", scheduledFor: null });
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/insights/${id}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      await load();
      alert(`Published. Commit ${data.commitSha?.slice(0, 7)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function onSchedule() {
    if (!scheduledFor) {
      setError("Pick a schedule date/time first");
      return;
    }
    await savePatch({
      status: "scheduled",
      scheduledFor: new Date(scheduledFor).toISOString(),
    });
    alert("Scheduled. OWnet cron will publish when due (INSIGHTS_CRON_SECRET + Render cron).");
  }

  async function uploadHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", "hero");
    const res = await fetch(`/api/insights/${id}/assets`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Hero upload failed");
      return;
    }
    await load();
  }

  async function uploadInlineImage(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", "inline");
    const res = await fetch(`/api/insights/${id}/assets`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Image upload failed");
      return;
    }
    const data = await res.json();
    const url = data.asset.url as string;
    editorRef.current?.insertHtml(
      `<p><img src="${url}" alt="" style="max-width:100%;height:auto" /></p>`
    );
    setBodyHtml((prev) => {
      /* sync deferred via editor */
      return prev;
    });
  }

  async function onImportDocx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch(`/api/insights/${id}/import-docx`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Import failed");
      return;
    }
    const data = await res.json();
    setBodyHtml(data.html);
    editorRef.current?.insertHtml("");
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-gray-500">Loading…</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/insights" className="text-sm text-[#3B6B8F] hover:underline">
          ← All insights
        </Link>
        {row?.status === "published" ? (
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
            Published
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {lint.length > 0 ? (
        <div className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="font-medium mb-2">Brand / SEO nudges (non-blocking)</p>
          <ul className="list-disc pl-5 space-y-1">
            {lint.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Slug (URL)</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            disabled={row?.status === "published"}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category pill</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. AI Readiness"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Secondary categories (comma-separated)
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            value={secondaryCategories}
            onChange={(e) => setSecondaryCategories(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Excerpt / deck</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[80px]"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => heroInputRef.current?.click()}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50"
          >
            Upload hero image
          </button>
          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadHero}
          />
          <button
            type="button"
            onClick={() => docxInputRef.current?.click()}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50"
          >
            Import Word (.docx)
          </button>
          <input
            ref={docxInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={onImportDocx}
          />
          <input
            ref={inlineImgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) uploadInlineImage(f);
            }}
          />
          <a
            href={`/insights/${id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50"
          >
            Preview HTML
          </a>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Body</label>
          <RichTextEmailEditor
            ref={editorRef}
            value={bodyHtml}
            onChange={setBodyHtml}
            pastePlainText={false}
            minHeight={360}
            placeholder="Write or import from Word…"
            onImageRequest={() => inlineImgRef.current?.click()}
          />
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">SEO / AEO</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">SEO title</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Meta description</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[72px]"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Twitter title</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={twitterTitle}
              onChange={(e) => setTwitterTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Twitter description
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[72px]"
              value={twitterDescription}
              onChange={(e) => setTwitterDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Twitter image path (optional, repo path from site root)
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
              value={twitterImagePath}
              onChange={(e) => setTwitterImagePath(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Author slug (path under /authors/)
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
              value={authorSlug}
              onChange={(e) => setAuthorSlug(e.target.value)}
              placeholder="bill-douglas"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Publication date (JSON-LD / byline)
          </label>
          <input
            type="datetime-local"
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={datePublished}
            onChange={(e) => setDatePublished(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Schedule publish (UTC stored; set OWnet cron on Render)
          </label>
          <input
            type="datetime-local"
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Topic cluster links (one relative href per line, e.g. ../../digital-infrastructure-noi-ai/index.html)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-xs min-h-[72px]"
            value={topicClusterPaths}
            onChange={(e) => setTopicClusterPaths(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => savePatch({ status: "draft" })}
            className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={saving || publishing || row?.status === "published"}
            onClick={onSchedule}
            className="rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            Save as scheduled
          </button>
          <button
            type="button"
            disabled={saving || publishing || row?.status === "published"}
            onClick={onPublishNow}
            className="rounded-lg bg-[#3B6B8F] text-white px-4 py-2 text-sm font-medium hover:bg-[#2E5570] disabled:opacity-50"
          >
            {publishing ? "Publishing…" : "Publish now"}
          </button>
        </div>
      </div>
    </div>
  );
}
