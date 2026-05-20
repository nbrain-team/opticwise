"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  status: string
  publishedAt: string | null
  coverImageUrl: string | null
  author: string
  createdAt: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all")

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    const res = await fetch("/api/blog/posts")
    if (res.ok) setPosts(await res.json())
    setLoading(false)
  }

  const filtered = posts.filter((p) => filter === "all" || p.status === filter)

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Publisher</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and publish posts directly to{" "}
            <a
              href="https://www.opticwise.com/insights/"
              target="_blank"
              rel="noopener"
              className="text-blue-600 hover:underline"
            >
              opticwise.com/insights
            </a>
          </p>
        </div>
        <Link
          href="/blog/new"
          className="inline-flex items-center gap-2 bg-[#123b6d] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0f2f58] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(["all", "draft", "published"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f}
            <span className="ml-1.5 text-xs text-gray-400">
              ({f === "all" ? posts.length : posts.filter((p) => p.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#123b6d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-400 font-medium">No posts yet</p>
          <Link
            href="/blog/new"
            className="mt-4 inline-block text-sm text-[#123b6d] hover:underline font-medium"
          >
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-[#123b6d]/30 transition-colors"
            >
              {post.coverImageUrl ? (
                <img
                  src={post.coverImageUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      post.status === "published"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {post.status === "published" ? "● Live" : "○ Draft"}
                  </span>
                  <span className="text-xs text-gray-400">{post.category}</span>
                </div>
                <p className="font-semibold text-gray-900 truncate">{post.title}</p>
                <p className="text-sm text-gray-400 truncate">{post.excerpt}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {post.status === "published" && (
                  <a
                    href={`https://www.opticwise.com/insights/${post.slug}/`}
                    target="_blank"
                    rel="noopener"
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="View live"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
                <Link
                  href={`/blog/${post.id}`}
                  className="px-3 py-1.5 text-sm text-[#123b6d] border border-[#123b6d]/30 rounded-lg hover:bg-[#123b6d]/5 transition-colors font-medium"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
