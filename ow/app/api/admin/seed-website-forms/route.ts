import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { FormFieldMapping, FormFieldType } from "@prisma/client";

/**
 * One-shot admin endpoint to (re)seed the canonical OpticWise marketing-site
 * forms — opticwise.com (Schedule Review, Contact, PPP Starter Kit, Insights
 * Newsletter) plus peakpropertyperformance.com (PPP Review).
 *
 * Idempotent: re-running converges to the spec without changing existing
 * Form ids or breaking historical FormSubmission rows.
 *
 * Auth: pass the platform AUTH_SECRET as `x-admin-key` header.
 *   curl -X POST https://ownet.opticwise.com/api/admin/seed-website-forms \
 *     -H "x-admin-key: $AUTH_SECRET"
 *
 * This route mirrors `scripts/seed-website-forms.ts` so it can be triggered
 * from anywhere (no Render Shell required). Both paths are kept in sync.
 */

export const dynamic = "force-dynamic";

const OWNER_EMAIL = "bill@opticwise.com";
const PIPELINE_NAME = "Landing Pages Leads";

const STAGE_FOR_SLUG: Record<string, string> = {
  "schedule-review": "Landing pages",
  "inbound-contact": "OW website inbound",
  "ppp-starter-kit": "PPP book leads",
  "insights-newsletter": "Landing pages",
  "ppp-review": "PPP book leads",
};

type SeedField = {
  label: string;
  fieldKey: string;
  fieldType: FormFieldType;
  required: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options?: { label: string; value: string }[] | null;
  mapsTo?: FormFieldMapping | null;
};

type SeedForm = {
  slug: string;
  name: string;
  description: string;
  submitButtonLabel: string;
  successMessage: string;
  dealTitleTemplate: string;
  fields: SeedField[];
};

const PROPERTY_TYPE_OPTIONS = [
  { label: "Multifamily", value: "multifamily" },
  { label: "Office", value: "office" },
  { label: "Mixed-Use", value: "mixed_use" },
  { label: "Industrial", value: "industrial" },
  { label: "Retail", value: "retail" },
  { label: "Hospitality", value: "hospitality" },
  { label: "Student Housing", value: "student_housing" },
  { label: "Senior Living", value: "senior_living" },
  { label: "Other", value: "other" },
];

const PORTFOLIO_SIZE_OPTIONS = [
  { label: "Single Property", value: "single" },
  { label: "2–5 Properties", value: "2_5" },
  { label: "6–20 Properties", value: "6_20" },
  { label: "20+ Properties", value: "20_plus" },
];

const FORMS: SeedForm[] = [
  {
    slug: "schedule-review",
    name: "Schedule Your Review",
    description:
      "Complimentary CRE Data & Digital Review Session. Triggered from the 'Schedule Your Review' CTA across opticwise.com.",
    submitButtonLabel: "Request Your Review",
    successMessage:
      "Thanks! We've received your request. Our team will reach out within one business day to schedule your review.",
    dealTitleTemplate: "Review Request — {firstName} {lastName} @ {company}",
    fields: [
      { label: "First Name", fieldKey: "first_name", fieldType: "text", required: true, mapsTo: "person_firstName" },
      { label: "Last Name", fieldKey: "last_name", fieldType: "text", required: true, mapsTo: "person_lastName" },
      { label: "Email", fieldKey: "email", fieldType: "email", required: true, mapsTo: "person_email" },
      { label: "Company", fieldKey: "company", fieldType: "text", required: false, mapsTo: "organization_name" },
      { label: "Phone", fieldKey: "phone", fieldType: "tel", required: false, mapsTo: "person_phone" },
      {
        label: "Property Type",
        fieldKey: "property_type",
        fieldType: "select",
        required: false,
        placeholder: "Select…",
        options: PROPERTY_TYPE_OPTIONS,
      },
      {
        label: "Tell us about your property",
        fieldKey: "message",
        fieldType: "textarea",
        required: false,
        placeholder: "Number of units, current challenges…",
        mapsTo: "deal_notes",
      },
    ],
  },

  {
    slug: "ppp-starter-kit",
    name: "PPP Starter Kit Download",
    description:
      "Free download — Chapter 1 of Peak Property Performance® plus the 5C™ framework diagram and PPP Review teaser worksheet.",
    submitButtonLabel: "Get the PPP Starter Kit",
    successMessage: "Check your inbox! Your PPP Starter Kit is on its way.",
    dealTitleTemplate: "PPP Starter Kit — {firstName} {lastName} @ {company}",
    fields: [
      {
        label: "Full Name",
        fieldKey: "name",
        fieldType: "text",
        required: true,
        placeholder: "Full Name",
        mapsTo: "person_firstName",
      },
      {
        label: "Work Email",
        fieldKey: "email",
        fieldType: "email",
        required: true,
        placeholder: "Work Email",
        mapsTo: "person_email",
      },
      {
        label: "Company",
        fieldKey: "company",
        fieldType: "text",
        required: true,
        placeholder: "Company",
        mapsTo: "organization_name",
      },
      {
        label: "Portfolio Size",
        fieldKey: "portfolio_size",
        fieldType: "select",
        required: false,
        placeholder: "Portfolio Size (optional)",
        options: PORTFOLIO_SIZE_OPTIONS,
      },
    ],
  },

  {
    slug: "inbound-contact",
    name: "Send a Message",
    description: "Goes directly to the OpticWise CRM. Real person responds within one business day.",
    submitButtonLabel: "Send Message",
    successMessage:
      "Thanks for reaching out. A real member of the OpticWise team will respond within one business day.",
    dealTitleTemplate: "Contact — {firstName} {lastName} @ {company}",
    fields: [
      { label: "First Name", fieldKey: "first_name", fieldType: "text", required: true, mapsTo: "person_firstName" },
      { label: "Last Name", fieldKey: "last_name", fieldType: "text", required: true, mapsTo: "person_lastName" },
      { label: "Email", fieldKey: "email", fieldType: "email", required: true, mapsTo: "person_email" },
      { label: "Company", fieldKey: "company", fieldType: "text", required: false, mapsTo: "organization_name" },
      { label: "Phone", fieldKey: "phone", fieldType: "tel", required: false, mapsTo: "person_phone" },
      {
        label: "What you're working on",
        fieldKey: "message",
        fieldType: "textarea",
        required: true,
        placeholder: "Current challenges, portfolio details, or what you'd like to discuss…",
        helpText: "Helpful context, not a gate. We respond personally within one business day.",
        mapsTo: "deal_notes",
      },
    ],
  },

  {
    slug: "ppp-review",
    name: "PPP Review Request",
    description:
      "Complimentary CRE Data & Digital Review. One building. 45 minutes. No software pitch. No rip-and-replace. Submitted from peakpropertyperformance.com.",
    submitButtonLabel: "Request Your PPP Review",
    successMessage:
      "Thanks! We've received your PPP Review request. The OpticWise team will reach out within one business day to schedule your 45-minute working session.",
    dealTitleTemplate: "PPP Review — {firstName} {lastName} @ {company}",
    fields: [
      { label: "First Name", fieldKey: "first_name", fieldType: "text", required: true, mapsTo: "person_firstName" },
      { label: "Last Name", fieldKey: "last_name", fieldType: "text", required: true, mapsTo: "person_lastName" },
      { label: "Work Email", fieldKey: "email", fieldType: "email", required: true, mapsTo: "person_email" },
      { label: "Company", fieldKey: "company", fieldType: "text", required: true, mapsTo: "organization_name" },
      {
        label: "Title / Role",
        fieldKey: "title",
        fieldType: "text",
        required: false,
        placeholder: "e.g. Asset Manager, COO, Director of IT",
        mapsTo: "person_title",
      },
      { label: "Phone", fieldKey: "phone", fieldType: "tel", required: false, mapsTo: "person_phone" },
      {
        label: "Property Type",
        fieldKey: "property_type",
        fieldType: "select",
        required: false,
        placeholder: "Select…",
        options: PROPERTY_TYPE_OPTIONS,
      },
      {
        label: "Portfolio Size",
        fieldKey: "portfolio_size",
        fieldType: "select",
        required: false,
        placeholder: "Select…",
        options: PORTFOLIO_SIZE_OPTIONS,
      },
      {
        label: "Building You'd Like Reviewed",
        fieldKey: "property_name",
        fieldType: "text",
        required: false,
        placeholder: "Property name or address",
        helpText: "The single building we'll focus on for the working session.",
      },
      {
        label: "What You'd Like to Cover",
        fieldKey: "message",
        fieldType: "textarea",
        required: false,
        placeholder: "Top 1–3 priorities, current challenges, or what brought you to PPP…",
        mapsTo: "deal_notes",
      },
    ],
  },

  {
    slug: "insights-newsletter",
    name: "Insights Newsletter",
    description: "Owner-controlled CRE insights, delivered. Subscribe to the OpticWise dispatch.",
    submitButtonLabel: "Subscribe",
    successMessage: "You're in. Look for the next OpticWise dispatch in your inbox.",
    dealTitleTemplate: "Newsletter — {firstName} {lastName} ({email})",
    fields: [
      {
        label: "First Name",
        fieldKey: "first_name",
        fieldType: "text",
        required: false,
        placeholder: "Your name",
        mapsTo: "person_firstName",
      },
      {
        label: "Email",
        fieldKey: "email",
        fieldType: "email",
        required: true,
        placeholder: "you@company.com",
        mapsTo: "person_email",
      },
      {
        label: "Company",
        fieldKey: "company",
        fieldType: "text",
        required: false,
        placeholder: "Company (optional)",
        mapsTo: "organization_name",
      },
    ],
  },
];

export async function POST(request: NextRequest) {
  const authKey = request.headers.get("x-admin-key");
  if (!authKey || authKey !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ---------- Resolve pipeline + stages ----------
  const pipeline = await prisma.pipeline.findUnique({
    where: { name: PIPELINE_NAME },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });
  if (!pipeline || pipeline.stages.length === 0) {
    return NextResponse.json(
      { error: `Pipeline "${PIPELINE_NAME}" not found or has no stages. Create it via the UI first.` },
      { status: 400 }
    );
  }

  // ---------- Resolve owner ----------
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    return NextResponse.json(
      { error: `Owner user not found for ${OWNER_EMAIL}. Make sure that user exists in the User table.` },
      { status: 400 }
    );
  }

  function pickStageId(slug: string): { stageId: string; stageName: string } {
    const preferred = STAGE_FOR_SLUG[slug];
    if (preferred) {
      const match = pipeline!.stages.find((s) => s.name === preferred);
      if (match) return { stageId: match.id, stageName: match.name };
    }
    const first = pipeline!.stages[0];
    return { stageId: first.id, stageName: first.name };
  }

  const results: Array<{
    slug: string;
    name: string;
    mode: "created" | "updated";
    stage: string;
    fieldCount: number;
    formId: string;
  }> = [];

  for (const def of FORMS) {
    const { stageId, stageName } = pickStageId(def.slug);
    const existing = await prisma.form.findUnique({ where: { slug: def.slug } });

    if (existing) {
      // Replace fields wholesale so re-running converges to the spec.
      await prisma.formField.deleteMany({ where: { formId: existing.id } });
      const updated = await prisma.form.update({
        where: { id: existing.id },
        data: {
          name: def.name,
          description: def.description,
          isActive: true,
          pipelineId: pipeline.id,
          stageId,
          ownerId: owner.id,
          dealTitleTemplate: def.dealTitleTemplate,
          submitButtonLabel: def.submitButtonLabel,
          successMessage: def.successMessage,
          honeypotFieldName: "website_url_extra",
          fields: {
            create: def.fields.map((f, i) => ({
              orderIndex: i,
              label: f.label,
              fieldKey: f.fieldKey,
              fieldType: f.fieldType,
              required: f.required,
              placeholder: f.placeholder ?? null,
              helpText: f.helpText ?? null,
              options: (f.options ?? undefined) as never,
              mapsTo: f.mapsTo ?? null,
            })),
          },
        },
        include: { fields: true },
      });
      results.push({
        slug: def.slug,
        name: updated.name,
        mode: "updated",
        stage: stageName,
        fieldCount: updated.fields.length,
        formId: updated.id,
      });
    } else {
      const created = await prisma.form.create({
        data: {
          name: def.name,
          slug: def.slug,
          description: def.description,
          isActive: true,
          pipelineId: pipeline.id,
          stageId,
          ownerId: owner.id,
          dealTitleTemplate: def.dealTitleTemplate,
          submitButtonLabel: def.submitButtonLabel,
          successMessage: def.successMessage,
          honeypotFieldName: "website_url_extra",
          createdById: owner.id,
          fields: {
            create: def.fields.map((f, i) => ({
              orderIndex: i,
              label: f.label,
              fieldKey: f.fieldKey,
              fieldType: f.fieldType,
              required: f.required,
              placeholder: f.placeholder ?? null,
              helpText: f.helpText ?? null,
              options: (f.options ?? undefined) as never,
              mapsTo: f.mapsTo ?? null,
            })),
          },
        },
        include: { fields: true },
      });
      results.push({
        slug: def.slug,
        name: created.name,
        mode: "created",
        stage: stageName,
        fieldCount: created.fields.length,
        formId: created.id,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    pipeline: { id: pipeline.id, name: pipeline.name },
    owner: { id: owner.id, email: owner.email, name: owner.name },
    forms: results,
    summary: {
      created: results.filter((r) => r.mode === "created").length,
      updated: results.filter((r) => r.mode === "updated").length,
      total: results.length,
    },
  });
}
