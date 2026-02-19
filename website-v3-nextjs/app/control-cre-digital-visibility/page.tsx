import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Control of CRE Digital Visibility",
  description: "Govern how your building, performance, and data context are represented across search engines, AI systems, and digital platforms.",
};

export default function Page() {
  return (
    <ContentPage
      slug="control-cre-digital-visibility"
      title="Control of CRE Digital Visibility"
      lead="Govern how your building, performance, and data context are represented across search engines, AI systems, and digital platforms."
      badge="Pillar"
    />
  );
}
