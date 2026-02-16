import Link from "next/link";
import { SITE } from "@/lib/site";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  reframingLine?: boolean;
  showCTA?: boolean;
  compact?: boolean;
}

export function PageHero({
  title,
  subtitle,
  description,
  reframingLine = true,
  showCTA = true,
  compact = false,
}: PageHeroProps) {
  return (
    <section
      className={`relative overflow-hidden ${compact ? "pt-28 pb-16" : "pt-32 pb-20 lg:pt-40 lg:pb-28"}`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-ow-navy via-ow-navy-light to-ow-navy" />
      <div className="absolute inset-0 hero-grid-overlay opacity-30" />
      <div className="absolute inset-0 hero-gradient" />

      {/* Content */}
      <div className="relative z-10 ow-container text-center">
        <h1
          className={`font-extrabold text-white leading-tight tracking-tight ${
            compact
              ? "text-3xl lg:text-4xl"
              : "text-4xl lg:text-5xl xl:text-6xl"
          } max-w-4xl mx-auto mb-6`}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto mb-6 font-light">
            {subtitle}
          </p>
        )}

        {description && (
          <p className="text-lg text-white/75 max-w-2xl mx-auto mb-8 leading-relaxed">
            {description}
          </p>
        )}

        {reframingLine && (
          <div className="ow-callout max-w-2xl mx-auto mb-8" style={{
            background: "rgba(16, 185, 129, 0.12)",
            borderColor: "rgba(16, 185, 129, 0.3)",
          }}>
            <p className="text-lg font-semibold text-white m-0">
              {SITE.reframingLine}
            </p>
          </div>
        )}

        {showCTA && (
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={SITE.primaryCTA.href} className="btn btn-primary">
              Schedule Review
            </Link>
            <Link
              href="/digital-infrastructure-noi-ai/"
              className="btn btn-outline"
            >
              Explore Pillars
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
