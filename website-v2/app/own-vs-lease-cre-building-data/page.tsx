import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "Own vs Lease CRE Building Data",
  description:
    "Owning CRE building data means the property owner retains full control, access, and decision rights over operational and tenant-generated data.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/own-vs-lease-cre-building-data.md"
      schemaPath="/own-vs-lease-cre-building-data/"
    />
  );
}
