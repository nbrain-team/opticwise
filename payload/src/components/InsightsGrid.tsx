"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface PostCard {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featureImageUrl?: string | null;
  categoryName?: string | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  tags?: string[];
}

export function InsightsGrid({ posts, tags }: { posts: PostCard[]; tags: string[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = posts;
    if (activeTag) {
      result = result.filter((p) => p.tags?.includes(activeTag));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, activeTag, search]);

  return (
    <>
      <section className="section-white" style={{ paddingTop: 48, paddingBottom: 0 }}>
        <div className="ow-container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => setActiveTag(null)} className={`role-tab ${!activeTag ? "active" : ""}`}>
                All
              </button>
              {tags.map((tag) => (
                <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`role-tab ${activeTag === tag ? "active" : ""}`}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search insights..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-ow-blue focus:ring-1 focus:ring-ow-blue/20" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-white" style={{ paddingTop: 32 }}>
        <div className="ow-container">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                {posts.length === 0 ? "Blog posts will appear here once content is added." : "No posts match your search."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((post) => (
                <Link key={post.id} href={`/insights/${post.slug}/`} className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-ow-blue/20 transition-all no-underline">
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    {post.featureImageUrl ? (
                      <img src={post.featureImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ow-navy to-ow-navy/80">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1">
                          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {post.categoryName && (
                      <span className="inline-block text-xs font-bold text-ow-blue bg-blue-50 px-3 py-1 rounded-full mb-3">
                        {post.categoryName}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-ow-blue transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                      {post.readingTime ? (
                        <>
                          <span>&middot;</span>
                          <span>{post.readingTime} min read</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
