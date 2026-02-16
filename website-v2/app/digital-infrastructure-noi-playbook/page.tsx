import type { Metadata } from "next";
import { ContentPageLayout } from "@/components/ContentPageLayout";

export const metadata: Metadata = {
  title: "Data & Digital Infrastructure NOI Playbook",
  description:
    "A repeatable, owner-led framework that turns commercial real estate data & digital infrastructure into predictable NOI instead of unmanaged operating costs.",
};

export default function Page() {
  return (
    <ContentPageLayout
      contentPath="content/pages/digital-infrastructure-noi-playbook.md"
      schemaPath="/digital-infrastructure-noi-playbook/"
    />
  );
}
