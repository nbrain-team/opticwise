import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { type FormInput, validateFormInput } from "@/lib/forms";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { orderIndex: "asc" } },
      pipeline: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { submissions: true } },
    },
  });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  return NextResponse.json({ form });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await prisma.form.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  let body: FormInput;
  try {
    body = (await request.json()) as FormInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const errors = validateFormInput(body);
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

  // Slug uniqueness (if changed)
  if (body.slug !== existing.slug) {
    const conflict = await prisma.form.findUnique({ where: { slug: body.slug } });
    if (conflict) return NextResponse.json({ error: `Slug "${body.slug}" already exists.` }, { status: 409 });
  }

  // Validate stage belongs to pipeline
  const stage = await prisma.stage.findUnique({ where: { id: body.stageId } });
  if (!stage || stage.pipelineId !== body.pipelineId) {
    return NextResponse.json({ error: "Selected stage does not belong to selected pipeline." }, { status: 400 });
  }

  // Replace-all-fields strategy: simpler than diffing, and FormSubmission rows
  // reference Form (not FormField) so we don't break historical submissions.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.form.update({
      where: { id },
      data: {
        name: body.name.trim(),
        slug: body.slug.trim(),
        description: body.description?.trim() || null,
        internalNotes: body.internalNotes?.trim() || null,
        isActive: body.isActive,
        pipelineId: body.pipelineId,
        stageId: body.stageId,
        ownerId: body.ownerId,
        dealTitleTemplate: body.dealTitleTemplate.trim(),
        submitButtonLabel: body.submitButtonLabel?.trim() || "Submit",
        successMessage: body.successMessage?.trim() || "Thanks — we'll be in touch shortly.",
        honeypotFieldName: body.honeypotFieldName.trim(),
        footerHtml: body.footerHtml?.trim() || null,
        confirmationEmailEnabled: !!body.confirmationEmailEnabled,
        confirmationEmailSubject: body.confirmationEmailEnabled
          ? body.confirmationEmailSubject?.trim() || null
          : null,
        confirmationEmailFromName:
          body.confirmationEmailFromName?.trim() || "Bill Demas",
        confirmationEmailReplyTo: body.confirmationEmailReplyTo?.trim() || null,
        confirmationEmailHtml: body.confirmationEmailEnabled
          ? body.confirmationEmailHtml?.trim() || null
          : null,
      },
    });
    await tx.formField.deleteMany({ where: { formId: id } });
    await tx.formField.createMany({
      data: body.fields.map((f, i) => ({
        formId: id,
        orderIndex: i,
        label: f.label.trim(),
        fieldKey: f.fieldKey.trim(),
        fieldType: f.fieldType,
        required: f.required,
        placeholder: f.placeholder?.trim() || null,
        helpText: f.helpText?.trim() || null,
        options: f.options ?? undefined,
        mapsTo: f.mapsTo ?? null,
      })),
    });
    return tx.form.findUnique({
      where: { id },
      include: { fields: { orderBy: { orderIndex: "asc" } } },
    });
  });

  return NextResponse.json({ form: updated });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  // Soft delete via isActive=false so historical submissions remain navigable.
  // Actual hard-delete is intentionally not exposed.
  await prisma.form.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
