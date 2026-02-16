import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "5S® Wireless Connectivity",
  description:
    "5S® is OpticWise's wireless connectivity product delivering a 5S® user experience (UX) over owner-controlled data & digital infrastructure.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/5s-wireless-connectivity.md"
      schemaPath="/5s-wireless-connectivity/"
    />
  );
}
