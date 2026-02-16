import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "BoT® (Building of Things®)",
  description:
    "Building of Things® (BoT®) is OpticWise's strategic approach to consolidate all your property's networks onto the fewest possible physical networks.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/bot-building-of-things.md"
      schemaPath="/bot-building-of-things/"
    />
  );
}
