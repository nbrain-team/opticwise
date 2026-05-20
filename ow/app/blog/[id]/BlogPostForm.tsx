"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const BlogEditor = dynamic(() => import("../BlogEditor"), { ssr: false })

const CATEGORIES = [
  "AI Readiness",
  "Building Intelligence",
  "Case Studies & Proof",
  "CRE Strategy",
  "Data Ownership",
  "Digital Infrastructure",
  "NOI & Revenue",
  "Operational Control",
  "Smart Buildings",
  "Tenant Experience",
  "The 5C™ Plan",
  "Vendor Control & Governance",
]

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageUrl: string | null
  author: string
  category: string
  secondaryCats: string | null
  tags: string[]
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  status: string
  publishedAt: string | null
}

interface BlogPostFormProps {
  initialPost?: BlogPost
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export default function BlogPostForm({ initialPost }: BlogPostFormProps) {
  const router = useRouter()
  const isEdit = !!initialPost

  const [title, setTitle] = useState(initialPost?.title || "")
  const [slug, setSlug] = useState(initialPost?.slug || "")
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "")
  const [content, setContent] = useState(initialPost?.content || "")
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.coverImageUrl || "")
  const [author, setAuthor] = useState(initialPost?.author || "Bill Douglas")
  const [category, setCategory] = useState(initialPost?.category || "Building Intelligence")
  const [secondaryCats, setSecondaryCats] = useState(initialPost?.secondaryCats || "")
  const [tagsInput, setTagsInput] = useState(initialPost?.tags?.join(", ") || "")
  const [metaTitle, setMetaTitle] = useState(initialPost?.metaTitle || "")
  const [metaDescription, setMetaDescription] = useState(initialPost?.metaDescription || "")
  const [metaKeywords, setMetaKeywords] = useState(initialPost?.metaKeywords || "")

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState("")
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null)

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManuallyEdited) {
      setSlug(slugify(val))
    }
  }

  async function savePost(): Promise<string | null> {
    setError("")
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const body = {
      title,
      slug,
      excerpt,
      content,
      coverImageUrl: coverImageUrl || null,
      author,
      category,
      secondaryCats: secondaryCats || null,
      tags,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
    }

    const url = isEdit ? `/api/blog/posts/${initialPost!.id}` : "/api/blog/posts"
    const method = isEdit ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to save post")
      return null
    }

    const post = await res.json()
    return post.id
  }

  async function handleSave() {
    setSaving(true)
    const id = await savePost()
    setSaving(false)
    if (id) {
      if (!isEdit) router.push(`/blog/${id}`)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    setError("")
    setPublishSuccess(null)

    const id = isEdit ? initialPost!.id : await savePost()
    if (!id) {
      setPublishing(false)
      return
    }

    const res = await fetch(`/api/blog/posts/${id}/publish`, { method: "POST" })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Publish failed")
      setPublishing(false)
      return
    }

    setPublishSuccess(data.url)
    setPublishing(false)
    router.refresh()
  }

  const isPublished = initialPost?.status === "published"

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push("/blog")}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Blog Posts
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? "Edit Post" : "New Post"}</h1>
        {isPublished && (
          <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Live on opticwise.com
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {publishSuccess && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between">
          <span>
            Post published successfully!{" "}
            <a
              href={publishSuccess}
              target="_blank"
              rel="noopener"
              className="underline font-semibold"
            >
              View live →
            </a>
          </span>
          <button onClick={() => setPublishSuccess(null)} className="text-green-500 hover:text-green-700 ml-4">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter post title…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#123b6d] focus:ring-1 focus:ring-[#123b6d]/20 font-medium text-gray-900"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              URL Slug *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0">opticwise.com/insights/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }}
                placeholder="my-post-slug"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d] focus:ring-1 focus:ring-[#123b6d]/20 font-mono"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Excerpt / Subtitle *
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="One or two sentences that appear under the title in the hero and on the index card…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#123b6d] focus:ring-1 focus:ring-[#123b6d]/20 resize-none"
            />
          </div>

          {/* Content editor */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Article Content *
            </label>
            <BlogEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Publish actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Publish
            </p>
            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={saving || publishing}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save Draft"}
              </button>
              <button
                onClick={handlePublish}
                disabled={saving || publishing || !title || !slug || !excerpt || !content}
                className="w-full px-4 py-2.5 bg-[#123b6d] text-white rounded-lg text-sm font-semibold hover:bg-[#0f2f58] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {publishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing…
                  </>
                ) : isPublished ? (
                  "Republish to opticwise.com"
                ) : (
                  "Publish to opticwise.com"
                )}
              </button>
            </div>
            {isPublished && (
              <a
                href={`https://www.opticwise.com/insights/${initialPost!.slug}/`}
                target="_blank"
                rel="noopener"
                className="mt-3 block text-center text-xs text-green-600 hover:underline"
              >
                View live post →
              </a>
            )}
            <p className="mt-3 text-xs text-gray-400 leading-relaxed">
              Publishing commits the HTML directly to GitHub. Render deploys in ~1–2 minutes.
            </p>
          </div>

          {/* Cover Image */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Cover Image URL
            </label>
            <input
              type="text"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d] font-mono"
            />
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt="Preview"
                className="mt-3 w-full h-28 object-cover rounded-lg bg-gray-100"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <p className="mt-2 text-xs text-gray-400">1200×630px recommended (OG size)</p>
          </div>

          {/* Category + Author */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Primary Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Secondary Categories
              </label>
              <input
                type="text"
                value={secondaryCats}
                onChange={(e) => setSecondaryCats(e.target.value)}
                placeholder="AI Readiness, Smart Buildings"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d]"
              />
              <p className="mt-1 text-xs text-gray-400">Comma-separated (for filtering)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Data Ownership, AI, Smart Buildings"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d]"
              />
              <p className="mt-1 text-xs text-gray-400">Comma-separated</p>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">SEO</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Leave blank to use post title"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                placeholder="Leave blank to use excerpt"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta Keywords</label>
              <input
                type="text"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="keyword1, keyword2, …"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#123b6d]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
