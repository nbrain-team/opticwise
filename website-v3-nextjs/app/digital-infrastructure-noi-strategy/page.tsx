import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure NOI Strategy",
  description: "The intentional design, ownership, and control of a property's networks, systems, and data to directly increase net operating income.",
};

export default function Page() {
  return (
    <ContentPage
      slug="digital-infrastructure-noi-strategy"
      title="Data & Digital Infrastructure NOI Strategy"
      lead="The intentional design, ownership, and control of a property's networks, systems, and data to directly increase net operating income."
      badge="Pillar"
    />
  );
}
