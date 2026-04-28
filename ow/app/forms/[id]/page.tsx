import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import FormEditor from "../FormEditor";

export const dynamic = "force-dynamic";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const form = await prisma.form.findUnique({
    where: { id },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!form) notFound();

  const publicHost = (process.env.PLATFORM_PUBLIC_URL || "https://ownet.opticwise.com").replace(
    /\/+$/,
    ""
  );

  const initialForm = {
    name: form.name,
    slug: form.slug,
    description: form.description ?? "",
    isActive: form.isActive,
    pipelineId: form.pipelineId,
    stageId: form.stageId,
    ownerId: form.ownerId,
    dealTitleTemplate: form.dealTitleTemplate,
    submitButtonLabel: form.submitButtonLabel,
    successMessage: form.successMessage,
    honeypotFieldName: form.honeypotFieldName,
    fields: form.fields.map((f) => ({
      id: f.id,
      label: f.label,
      fieldKey: f.fieldKey,
      fieldType: f.fieldType,
      required: f.required,
      placeholder: f.placeholder,
      helpText: f.helpText,
      options: (f.options as { label: string; value: string }[] | null) ?? null,
      mapsTo: (f.mapsTo ?? "none") as
        | "none"
        | "person_firstName"
        | "person_lastName"
        | "person_email"
        | "person_phone"
        | "person_title"
        | "organization_name"
        | "organization_websiteUrl"
        | "organization_domain"
        | "deal_notes",
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FormEditor formId={form.id} initialForm={initialForm} publicHost={publicHost} />
    </div>
  );
}
