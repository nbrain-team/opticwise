import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getAllPosts, getMediaUrl } from "@/lib/payload-helpers";
import { RichContent } from "@/components/RichContent";
import { CTASection } from "@/components/CTASection";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p: any) => ({ slug: p.slug }));
}

export default async function InsightPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  const p = post as any;
  const featureImage = getMediaUrl(p.featureImage);
  const categoryName = typeof p.category === "object" ? p.category?.title : null;

  return (
    <>
      <section className="relative overflow-hidden pt-36 pb-16">
        <div className="absolute inset-0 z-0">
          {featureImage ? (
            <img src={featureImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <img src="/images/hero-industry.jpg" alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="hero-overlay" />
        <div className="hero-grid-lines" />
        <div className="relative z-10 ow-container max-w-3xl">
          <Link href="/insights" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 mb-6 transition-colors">
            &larr; Back to Insights
          </Link>
          {categoryName && (
            <span className="block text-xs font-bold text-blue-300 bg-blue-400/10 px-4 py-1.5 rounded-full w-fit mb-4">
              {categoryName}
            </span>
          )}
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">{p.title}</h1>
          {p.excerpt && <p className="text-lg text-white/70">{p.excerpt}</p>}
          {p.publishedAt && (
            <p className="text-sm text-white/40 mt-4">
              {new Date(p.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              {p.readingTime ? ` \u00b7 ${p.readingTime} min read` : ""}
            </p>
          )}
        </div>
      </section>

      <section className="ow-section bg-white">
        <div className="ow-container max-w-3xl mx-auto">
          <RichContent html={p.htmlContent} />
        </div>
      </section>

      <CTASection />
    </>
  );
}
