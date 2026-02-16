import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "AI-Ready Commercial Real Estate",
  description:
    "AI-ready commercial real estate refers to properties designed and operated with owner-controlled data & digital infrastructure and high-fidelity data.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/ai-ready-commercial-real-estate.md"
      schemaPath="/ai-ready-commercial-real-estate/"
    />
  );
}
