import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-ow-navy text-white/60">
      <div className="ow-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div>
            <Image src="/images/ow_logo.png" alt="OpticWise" width={120} height={32} className="h-8 w-auto mb-4" />
            <p className="text-sm text-white/50 leading-relaxed">
              Owner-controlled data &amp; digital infrastructure for commercial real estate.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {SITE.pillars.map((p) => (
                <li key={p.href}><Link href={p.href} className="text-sm hover:text-white transition-colors">{p.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Products &amp; Services</h4>
            <ul className="space-y-2.5">
              {SITE.products.map((p) => (
                <li key={p.href}><Link href={p.href} className="text-sm hover:text-white transition-colors">{p.label}</Link></li>
              ))}
              <li><Link href="/how-we-operate-digital-infrastructure/" className="text-sm hover:text-white transition-colors">How We Operate</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Resources</h4>
            <ul className="space-y-2.5">
              <li><Link href="/insights/" className="text-sm hover:text-white transition-colors">Insights</Link></li>
              <li><Link href="/faq/" className="text-sm hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/digital-infrastructure-noi-ai/" className="text-sm hover:text-white transition-colors">Category Hub</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} OpticWise. All rights reserved.</p>
          <p className="text-xs text-white/25 max-w-sm text-center md:text-right">{SITE.closingLine}</p>
        </div>
      </div>
    </footer>
  );
}
