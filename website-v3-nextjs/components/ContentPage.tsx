import { getPageBySlug } from "@/lib/ghost";
import { SubpageHero } from "./SubpageHero";
import { GhostContent } from "./GhostContent";
import { CTASection } from "./CTASection";
import { SITE } from "@/lib/site";

interface ContentPageProps {
  slug: string;
  title: string;
  lead?: string;
  description?: string;
  badge?: string;
  bgImage?: string;
  fallbackContent?: string;
}

export async function ContentPage({ slug, title, lead, description, badge, bgImage, fallbackContent }: ContentPageProps) {
  const page = await getPageBySlug(slug);

  return (
    <>
      <SubpageHero title={title} lead={lead} description={description} badge={badge} bgImage={bgImage} />

      <section className="ow-section bg-white">
        <div className="ow-container max-w-3xl mx-auto">
          <GhostContent html={page?.html ?? null} fallbackMarkdown={fallbackContent} />
        </div>
      </section>

      <CTASection />

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
