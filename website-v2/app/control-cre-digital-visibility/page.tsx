import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "Control of CRE Digital Visibility",
  description:
    "Control of CRE digital visibility is the ability of a commercial real estate owner to govern how their building and data context are represented across search engines and AI systems.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/control-cre-digital-visibility.md"
      schemaPath="/control-cre-digital-visibility/"
    />
  );
}
