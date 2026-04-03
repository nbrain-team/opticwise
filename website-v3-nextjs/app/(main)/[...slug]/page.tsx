import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug, getAllPages } from "@/lib/ghost";
import { SubpageHero } from "@/components/SubpageHero";
import { GhostContent } from "@/components/GhostContent";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const pages = await getAllPages();
  return pages.map((p) => ({ slug: [p.slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Promise<Metadata> {
  const slug = params.slug.join("/");
  const page = await getPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.custom_excerpt || undefined,
    openGraph: page.og_image
      ? { images: [{ url: page.og_image }] }
      : page.feature_image
        ? { images: [{ url: page.feature_image }] }
        : undefined,
  };
}

export default async function GhostPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug.join("/");
  const page = await getPageBySlug(slug);
  if (!page) return notFound();

  return (
    <>
      <SubpageHero
        title={page.title}
        lead={page.custom_excerpt || undefined}
        bgImage={page.feature_image || undefined}
      />

      <section className="ow-section bg-white">
        <div className="ow-container">
          <GhostContent html={page.html} />
        </div>
      </section>

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
