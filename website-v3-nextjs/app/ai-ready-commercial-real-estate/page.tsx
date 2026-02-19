import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI-Ready Commercial Real Estate",
  description: "Properties designed and operated with owner-controlled data & digital infrastructure and high-fidelity data.",
};

export default function Page() {
  return (
    <ContentPage
      slug="ai-ready-commercial-real-estate"
      title="AI-Ready Commercial Real Estate"
      lead="Properties designed and operated with owner-controlled data & digital infrastructure and high-fidelity data."
      badge="Pillar"
    />
  );
}
