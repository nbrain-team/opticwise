import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "CRE AI Readiness",
  description: "The condition in which a CRE owner controls their data & digital infrastructure well enough for AI to produce reliable insights.",
};

export default function Page() {
  return (
    <ContentPage
      slug="cre-ai-readiness"
      title="CRE AI Readiness"
      lead="The condition in which a CRE owner controls their data & digital infrastructure well enough for AI to produce reliable insights."
      badge="Pillar"
    />
  );
}
