import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-ow-navy text-white">
      {/* CTA Band */}
      <div className="border-b border-white/10">
        <div className="ow-container py-16 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Ready to Own Your Data &amp; Digital Infrastructure?
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-8">
            {SITE.primaryCTA.microcopy}
          </p>
          <Link href={SITE.primaryCTA.href} className="btn btn-white">
            {SITE.primaryCTA.label}
          </Link>
        </div>
      </div>

      {/* Footer Links */}
      <div className="ow-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-ow-blue flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 text-white"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </div>
              <span className="text-lg font-bold">OpticWise</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Owner-controlled data &amp; digital infrastructure for commercial
              real estate.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {SITE.nav.pillars.slice(0, 4).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Products &amp; Services
            </h3>
            <ul className="space-y-2.5">
              {SITE.nav.products.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/how-we-operate-digital-infrastructure/"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  How We Operate
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/insights/"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Insights
                </Link>
              </li>
              <li>
                <Link
                  href="/faq/"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/digital-infrastructure-noi-ai/"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Category Hub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} OpticWise. All rights reserved.
          </p>
          <p className="text-xs text-white/30 max-w-xl text-center md:text-right">
            {SITE.closingLine}
          </p>
        </div>
      </div>
    </footer>
  );
}
