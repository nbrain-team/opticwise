import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure NOI Playbook",
  description: "A repeatable, owner-led framework that turns data & digital infrastructure into predictable NOI.",
};

export default function Page() {
  return (
    <ContentPage
      slug="digital-infrastructure-noi-playbook"
      title="Data & Digital Infrastructure NOI Playbook"
      lead="A repeatable, owner-led framework that turns data & digital infrastructure into predictable NOI."
      badge="Pillar"
    />
  );
}
