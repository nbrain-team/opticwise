import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure NOI Strategy",
  description:
    "Data & digital infrastructure NOI strategy is the intentional design, ownership, and control of a property's networks, systems, and data to directly increase net operating income.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/digital-infrastructure-noi-strategy.md"
      schemaPath="/digital-infrastructure-noi-strategy/"
    />
  );
}
