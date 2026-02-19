import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Own vs Lease CRE Building Data",
  description: "Owning CRE building data means the property owner retains full control over operational and tenant-generated data.",
};

export default function Page() {
  return (
    <ContentPage
      slug="own-vs-lease-cre-building-data"
      title="Own vs Lease CRE Building Data"
      lead="Owning CRE building data means the property owner retains full control over operational and tenant-generated data."
      badge="Pillar"
    />
  );
}
