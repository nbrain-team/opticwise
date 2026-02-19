import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure, NOI, and AI in Commercial Real Estate",
  description: "Commercial real estate is entering a structural shift. Not a technology cycle. A control cycle.",
};

export default function Page() {
  return (
    <ContentPage
      slug="digital-infrastructure-noi-ai"
      title="Data & Digital Infrastructure, NOI, and AI in Commercial Real Estate"
      lead="Commercial real estate is entering a structural shift. Not a technology cycle. A control cycle."
      badge="Category Hub"
    />
  );
}
