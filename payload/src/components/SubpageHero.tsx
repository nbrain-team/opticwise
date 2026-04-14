import Link from "next/link";
import { SITE } from "@/lib/site";

interface SubpageHeroProps {
  title: string;
  lead?: string;
  description?: string;
  badge?: string;
  bgImage?: string;
}

export function SubpageHero({ title, lead, description, badge, bgImage = "/images/project-catalyst.jpg" }: SubpageHeroProps) {
  return (
    <section className="relative overflow-hidden pt-36 pb-20">
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="hero-overlay" />
      <div className="hero-grid-lines" />
      <div className="relative z-10 ow-container">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 mb-5 transition-colors">
          &larr; Home
        </Link>
        {badge && (
          <span className="block text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-400/10 px-4 py-1.5 rounded-full w-fit mb-4">
            {badge}
          </span>
        )}
        <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">{title}</h1>
        {lead && <p className="text-lg text-white/85 leading-relaxed mb-4">{lead}</p>}
        {description && <p className="text-base text-white/65 leading-relaxed mb-4">{description}</p>}
        <div className="mt-6 px-6 py-4 rounded-xl bg-ow-blue/15 border border-blue-400/30 backdrop-blur-sm">
          <p className="text-base font-bold text-white m-0">{SITE.reframingLine}</p>
        </div>
      </div>
    </section>
  );
}
