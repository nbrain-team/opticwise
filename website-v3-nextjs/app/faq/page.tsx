import type { Metadata } from "next";
import { SubpageHero } from "@/components/SubpageHero";
import { FAQPageContent } from "@/components/FAQPageContent";
import { CTASection } from "@/components/CTASection";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ: Owning Your Data & Digital Infrastructure",
  description:
    "Frequently asked questions about owning your data and digital infrastructure in commercial real estate. Organized by role: Developer, Owner, Operator, Property Manager, Asset Manager, and ERTC.",
};

export default function Page() {
  return (
    <>
      <SubpageHero
        title="FAQ: Owning Your Data & Digital Infrastructure"
        lead="Real questions from CRE professionals who are making the shift from vendor convenience to owner control. Find answers organized by your role\u2014or explore the general hub below."
        badge="Resources"
      />

      <FAQPageContent />

      <CTASection />

      <section className="bg-ow-navy py-14">
        <div className="ow-container text-center">
          <p className="text-sm text-white/70 font-medium">{SITE.closingLine}</p>
        </div>
      </section>
    </>
  );
}
