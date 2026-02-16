import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "How OpticWise Operates Data & Digital Infrastructure",
  description:
    "OpticWise provides managed services that include design, implementation, and operation across facilities and portfolios.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/how-we-operate-digital-infrastructure.md"
      schemaPath="/how-we-operate-digital-infrastructure/"
    />
  );
}
