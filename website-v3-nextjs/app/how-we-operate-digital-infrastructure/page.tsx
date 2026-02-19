import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How OpticWise Operates Data & Digital Infrastructure",
  description: "Most owners have an IT strategy. Almost nobody has an OT strategy. That's where control gets lost.",
};

export default function Page() {
  return (
    <ContentPage
      slug="how-we-operate-digital-infrastructure"
      title="How OpticWise Operates Data & Digital Infrastructure"
      lead="Most owners have an IT strategy. Almost nobody has an OT strategy. That's where control gets lost."
      badge="Operations"
    />
  );
}
