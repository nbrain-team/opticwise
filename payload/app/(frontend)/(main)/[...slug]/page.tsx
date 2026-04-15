import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug, getAllPages, getMediaUrl } from "@/lib/payload-helpers";
import { SubpageHero } from "@/components/SubpageHero";
import { BlockRenderer } from "@/components/BlockRenderer";
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
  const hasBlocks = p.layout && p.layout.length > 0;

  return (
    <>
      <SubpageHero
        title={p.title}
        lead={p.excerpt || undefined}
        badge={p.heroBadge || undefined}
        bgImage={getMediaUrl(p.heroImage) || undefined}
      />

      {hasBlocks ? (
        <BlockRenderer blocks={p.layout} />
      ) : (
        <section className="ow-section bg-white">
          <div className="ow-container max-w-3xl mx-auto text-center">
            <p className="text-gray-400">This page is being built. Check back soon.</p>
          </div>
        </section>
      )}

      <CTASection />

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
