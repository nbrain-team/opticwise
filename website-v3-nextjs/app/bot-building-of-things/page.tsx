import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "BoT® (Building of Things®)",
  description: "Consolidate all your property's networks onto the fewest possible physical networks—reducing build cost and operating cost while increasing control.",
};

export default function Page() {
  return (
    <ContentPage
      slug="bot-building-of-things"
      title="BoT® (Building of Things®)"
      lead="Consolidate all your property's networks onto the fewest possible physical networks—reducing build cost and operating cost while increasing control."
      badge="Product"
    />
  );
}
