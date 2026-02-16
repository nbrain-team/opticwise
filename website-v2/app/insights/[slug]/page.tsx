import { notFound } from "next/navigation";
import Link from "next/link";
import { getInsightBySlug, listInsightPosts } from "@/lib/content";
import { MarkdownPage } from "@/components/MarkdownPage";
import { SchemaJsonLd } from "@/components/SchemaJsonLd";
import { CTASection } from "@/components/CTASection";

export function generateStaticParams() {
  return listInsightPosts().map((p) => ({ slug: p.slug }));
}

export default function InsightPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getInsightBySlug(params.slug);
  if (!post) return notFound();

  const extras = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      author: { "@type": "Organization", name: "OpticWise" },
      mainEntityOfPage: { "@type": "WebPage" },
    },
  ];

  return (
    <>
      <SchemaJsonLd path={`/insights/${params.slug}/`} extras={extras} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-ow-navy via-ow-navy-light to-ow-navy" />
        <div className="absolute inset-0 hero-grid-overlay opacity-30" />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative z-10 ow-container">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/insights/"
              className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/90 mb-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Insights
            </Link>
            {post.category && (
              <span className="inline-block text-xs font-medium text-ow-accent bg-ow-accent/10 px-3 py-1 rounded-full mb-4">
                {post.category}
              </span>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              {post.title}
            </h1>
            {post.description && (
              <p className="text-lg text-white/70">{post.description}</p>
            )}
            {post.date && (
              <p className="text-sm text-white/40 mt-4">{post.date}</p>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="ow-section bg-white">
        <div className="ow-container">
          <div className="max-w-3xl mx-auto">
            <MarkdownPage markdown={post.content} />
          </div>
        </div>
      </section>

      <CTASection variant="blue" />
    </>
  );
}
