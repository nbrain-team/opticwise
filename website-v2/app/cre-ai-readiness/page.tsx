import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "CRE AI Readiness",
  description:
    "CRE AI readiness is the condition in which a commercial real estate owner controls their data & digital infrastructure well enough for AI to produce reliable, actionable insights.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/cre-ai-readiness.md"
      schemaPath="/cre-ai-readiness/"
    />
  );
}
