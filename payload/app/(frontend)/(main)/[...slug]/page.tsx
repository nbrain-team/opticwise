import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug, getAllPages, getMediaUrl } from "@/lib/payload-helpers";
import { SubpageHero } from "@/components/SubpageHero";
import { RichContent } from "@/components/RichContent";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const pages = await getAllPages();
  return pages.map((p: any) => ({ slug: [p.slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug.join("/"));
  if (!page) return {};

  const p = page as any;
  return {
    title: p.meta?.title || p.title,
    description: p.meta?.description || p.excerpt || undefined,
    openGraph: p.meta?.image
      ? { images: [{ url: getMediaUrl(p.meta.image) }] }
      : p.heroImage
        ? { images: [{ url: getMediaUrl(p.heroImage) }] }
        : undefined,
  };
}

export default async function PayloadPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug.join("/"));
  if (!page) return notFound();

  const p = page as any;

  return (
    <>
      <SubpageHero
        title={p.title}
        lead={p.excerpt || undefined}
        badge={p.heroBadge || undefined}
        bgImage={getMediaUrl(p.heroImage) || undefined}
      />

      {/* Render layout blocks if present */}
      {p.layout && p.layout.length > 0 ? (
        p.layout.map((block: any, index: number) => (
          <LayoutBlock key={block.id || index} block={block} />
        ))
      ) : (
        <section className="ow-section bg-white">
          <div className="ow-container">
            <RichContent html={null} />
          </div>
        </section>
      )}

      <CTASection />

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">
            {SITE.closingLine}
          </p>
        </div>
      </section>
    </>
  );
}

function LayoutBlock({ block }: { block: any }) {
  switch (block.blockType) {
    case "content":
      return <ContentBlockRenderer block={block} />;
    case "cta":
      return <CTASection />;
    default:
      return null;
  }
}

function ContentBlockRenderer({ block }: { block: any }) {
  const bgClass = block.backgroundColor === "gray" ? "bg-gray-50" : block.backgroundColor === "dark" ? "bg-ow-navy" : "bg-white";
  const textClass = block.backgroundColor === "dark" ? "text-white" : "";

  return (
    <section className={`ow-section ${bgClass}`}>
      <div className={`ow-container ${block.layout === "narrow" ? "max-w-3xl mx-auto" : ""}`}>
        {block.eyebrow && (
          <span className={`text-xs font-bold uppercase tracking-widest ${block.backgroundColor === "dark" ? "text-blue-300" : "text-ow-blue"} mb-3 block`}>
            {block.eyebrow}
          </span>
        )}
        {block.heading && (
          <h2 className={`text-3xl lg:text-4xl font-extrabold ${block.backgroundColor === "dark" ? "text-white" : "text-gray-900"} leading-tight mb-6`}>
            {block.heading}
          </h2>
        )}
        <div className={`rich-content ${textClass}`}>
          {/* Rich text content would be serialized here */}
        </div>
      </div>
    </section>
  );
}
