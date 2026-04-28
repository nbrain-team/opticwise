import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  type FormInput,
  slugify,
  validateFormInput,
} from "@/lib/forms";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forms = await prisma.form.findMany({
    include: {
      pipeline: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { submissions: true, fields: true } },
      submissions: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    forms: forms.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      isActive: f.isActive,
      pipeline: f.pipeline,
      stage: f.stage,
      owner: f.owner,
      fieldCount: f._count.fields,
      submissionCount: f._count.submissions,
      lastSubmissionAt: f.submissions[0]?.createdAt ?? null,
      updatedAt: f.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: FormInput;
  try {
    body = (await request.json()) as FormInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Auto-derive slug if missing
  if (!body.slug && body.name) body.slug = slugify(body.name);

  const errors = validateFormInput(body);
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

  // Slug uniqueness
  const existing = await prisma.form.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json({ error: `Slug "${body.slug}" already exists.` }, { status: 409 });
  }

  // Validate stage belongs to pipeline
  const stage = await prisma.stage.findUnique({ where: { id: body.stageId } });
  if (!stage || stage.pipelineId !== body.pipelineId) {
    return NextResponse.json({ error: "Selected stage does not belong to selected pipeline." }, { status: 400 });
  }

  const form = await prisma.form.create({
    data: {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      isActive: body.isActive,
      pipelineId: body.pipelineId,
      stageId: body.stageId,
      ownerId: body.ownerId,
      dealTitleTemplate: body.dealTitleTemplate.trim(),
      submitButtonLabel: body.submitButtonLabel?.trim() || "Submit",
      successMessage: body.successMessage?.trim() || "Thanks — we'll be in touch shortly.",
      honeypotFieldName: body.honeypotFieldName.trim(),
      createdById: session.userId,
      fields: {
        create: body.fields.map((f, i) => ({
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
      },
    },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });

  return NextResponse.json({ form }, { status: 201 });
}
