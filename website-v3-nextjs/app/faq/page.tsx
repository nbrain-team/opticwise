import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ: Owning Your Data & Digital Infrastructure",
  description: "Questions and answers organized by role with Layer 1, Layer 2, and Advisory categories.",
};

export default function Page() {
  return (
    <ContentPage
      slug="faq"
      title="FAQ: Owning Your Data & Digital Infrastructure"
      lead="Questions and answers organized by role with Layer 1, Layer 2, and Advisory categories."
      badge="Resources"
    />
  );
}
