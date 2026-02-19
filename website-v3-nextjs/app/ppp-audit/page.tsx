import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "PPP Audit™",
  description: "PPP Audit™ is the Clarify entry point: it maps what you own, where value is leaking, and what data is trustworthy and portable.",
};

export default function Page() {
  return (
    <ContentPage
      slug="ppp-audit"
      title="PPP Audit™"
      lead="Peak Property Performance® (PPP™) is OpticWise's owner-first operating model for turning data & digital infrastructure into measurable outcomes."
      badge="Service · Clarify"
      description="PPP Audit™ is the Clarify entry point: it maps what you own, where value is leaking, and what data is trustworthy and portable."
    />
  );
}
