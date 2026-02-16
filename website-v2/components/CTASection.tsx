import Link from "next/link";
import { SITE } from "@/lib/site";

interface CTASectionProps {
  heading?: string;
  subheading?: string;
  variant?: "blue" | "dark" | "green";
}

export function CTASection({
  heading = "Your Next Step",
  subheading,
  variant = "blue",
}: CTASectionProps) {
  const bgMap = {
    blue: "bg-gradient-to-br from-ow-blue to-ow-blue-dark",
    dark: "bg-gradient-to-br from-ow-navy to-ow-navy-light",
    green: "bg-gradient-to-br from-ow-green to-emerald-700",
  };

  return (
    <section className={`${bgMap[variant]} relative overflow-hidden`}>
      <div className="absolute inset-0 hero-grid-overlay opacity-20" />
      <div className="relative z-10 ow-container py-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
          {heading}
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto mb-4 font-semibold">
          {SITE.primaryCTA.label}
        </p>
        <p className="text-white/70 max-w-xl mx-auto mb-8">
          {subheading ?? SITE.primaryCTA.microcopy}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href={SITE.primaryCTA.href} className="btn btn-white">
            Schedule Your Review
          </Link>
        </div>
        <p className="mt-8 text-sm text-white/50 max-w-lg mx-auto">
          {SITE.closingLine}
        </p>
      </div>
    </section>
  );
}
