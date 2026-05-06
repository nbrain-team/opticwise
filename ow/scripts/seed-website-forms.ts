/**
 * Seed the canonical opticwise.com forms into the OW Form Builder.
 *
 * Idempotent: re-running the script updates form attributes and replaces the
 * field set, while keeping the same form id (so the `slug` stays stable for
 * the marketing site and historical FormSubmission rows are preserved).
 *
 * Usage (Render shell or local with DATABASE_URL set):
 *   npx tsx scripts/seed-website-forms.ts
 *
 * Routing (verified against production DB on 2026-05-06):
 *   - Pipeline: "Landing Pages Leads"
 *   - Stages:   each form is routed to the most appropriate stage (see below)
 *   - Owner:    bill@opticwise.com
 */

import { PrismaClient } from "@prisma/client";
import type { FormFieldMapping, FormFieldType } from "@prisma/client";

const prisma = new PrismaClient();

const OWNER_EMAIL = "bill@opticwise.com";
const PIPELINE_NAME = "Landing Pages Leads";

// Each form routes to a specific stage within the pipeline. If the named
// stage doesn't exist, we fall back to the first stage.
const STAGE_FOR_SLUG: Record<string, string> = {
  "schedule-review": "Landing pages",
  "inbound-contact": "OW website inbound",
  "ppp-audit-request": "PPP book leads",
  "ppp-starter-kit": "PPP book leads",
  "insights-newsletter": "Landing pages",
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
  honeypotFieldName?: string;
  isActive?: boolean;
  fields: SeedField[];
};

// =====================
// Reusable option lists
// =====================

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

// =====================
// Form definitions — these mirror what's on opticwise.com today
// =====================

const FORMS: SeedForm[] = [
  // ---------------------------------------------------------------------
  // 1. SCHEDULE YOUR REVIEW
  // Replaces: ScheduleReviewPopup.tsx (popup triggered from CTAs across the
  // site — home hero, all CTASection blocks, every insight detail page,
  // /ppp-audit, /about, etc.)
  // ---------------------------------------------------------------------
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
      {
        label: "First Name",
        fieldKey: "first_name",
        fieldType: "text",
        required: true,
        mapsTo: "person_firstName",
      },
      {
        label: "Last Name",
        fieldKey: "last_name",
        fieldType: "text",
        required: true,
        mapsTo: "person_lastName",
      },
      {
        label: "Email",
        fieldKey: "email",
        fieldType: "email",
        required: true,
        mapsTo: "person_email",
      },
      {
        label: "Company",
        fieldKey: "company",
        fieldType: "text",
        required: false,
        mapsTo: "organization_name",
      },
      {
        label: "Phone",
        fieldKey: "phone",
        fieldType: "tel",
        required: false,
        mapsTo: "person_phone",
      },
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

  // ---------------------------------------------------------------------
  // 2. PPP STARTER KIT (LEAD MAGNET)
  // Replaces: LeadMagnetForm.tsx (used in homepage Lead Magnet section
  // and the leadMagnet CMS block).
  // ---------------------------------------------------------------------
  {
    slug: "ppp-starter-kit",
    name: "PPP Starter Kit Download",
    description:
      "Free download — Chapter 1 of Peak Property Performance® plus the 5C™ framework diagram and PPP Review teaser worksheet.",
    submitButtonLabel: "Get the PPP Starter Kit",
    successMessage:
      "Check your inbox! Your PPP Starter Kit is on its way.",
    dealTitleTemplate: "PPP Starter Kit — {firstName} {lastName} @ {company}",
    fields: [
      {
        label: "Full Name",
        fieldKey: "name",
        fieldType: "text",
        required: true,
        placeholder: "Full Name",
        mapsTo: "person_firstName", // processor auto-splits on space when key isn't first-name-like
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

  // ---------------------------------------------------------------------
  // 3. CONTACT — SEND A MESSAGE
  // Replaces: the existing /contact page form (currently CMS-rendered HTML
  // not wired to the CRM). Uses the pre-existing `inbound-contact` slug so
  // the historical 2 submissions stay attached to the same form id.
  // ---------------------------------------------------------------------
  {
    slug: "inbound-contact",
    name: "Send a Message",
    description:
      "Goes directly to the OpticWise CRM. Real person responds within one business day.",
    submitButtonLabel: "Send Message",
    successMessage:
      "Thanks for reaching out. A real member of the OpticWise team will respond within one business day.",
    dealTitleTemplate: "Contact — {firstName} {lastName} @ {company}",
    fields: [
      {
        label: "First Name",
        fieldKey: "first_name",
        fieldType: "text",
        required: true,
        mapsTo: "person_firstName",
      },
      {
        label: "Last Name",
        fieldKey: "last_name",
        fieldType: "text",
        required: true,
        mapsTo: "person_lastName",
      },
      {
        label: "Email",
        fieldKey: "email",
        fieldType: "email",
        required: true,
        mapsTo: "person_email",
      },
      {
        label: "Company",
        fieldKey: "company",
        fieldType: "text",
        required: false,
        mapsTo: "organization_name",
      },
      {
        label: "Phone",
        fieldKey: "phone",
        fieldType: "tel",
        required: false,
        mapsTo: "person_phone",
      },
      {
        label: "What you're working on",
        fieldKey: "message",
        fieldType: "textarea",
        required: true,
        placeholder:
          "Current challenges, portfolio details, or what you'd like to discuss…",
        helpText: "Helpful context, not a gate. We respond personally within one business day.",
        mapsTo: "deal_notes",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 4. PPP AUDIT REQUEST
  // Replaces: the broken "Schedule Your PPP Audit →" link on /ppp-audit
  // (currently href="#"). New form lands the request directly in CRM.
  // ---------------------------------------------------------------------
  {
    slug: "ppp-audit-request",
    name: "PPP Audit Request",
    description:
      "Complimentary working session for one building — map who owns what, where data lives, and where operational burden stacks up against your KPIs.",
    submitButtonLabel: "Request Your PPP Audit",
    successMessage:
      "Thanks! We've received your PPP Audit request. We'll reach out within one business day to schedule your working session.",
    dealTitleTemplate: "PPP Audit — {firstName} {lastName} @ {company}",
    fields: [
      {
        label: "First Name",
        fieldKey: "first_name",
        fieldType: "text",
        required: true,
        mapsTo: "person_firstName",
      },
      {
        label: "Last Name",
        fieldKey: "last_name",
        fieldType: "text",
        required: true,
        mapsTo: "person_lastName",
      },
      {
        label: "Email",
        fieldKey: "email",
        fieldType: "email",
        required: true,
        mapsTo: "person_email",
      },
      {
        label: "Company",
        fieldKey: "company",
        fieldType: "text",
        required: true,
        mapsTo: "organization_name",
      },
      {
        label: "Phone",
        fieldKey: "phone",
        fieldType: "tel",
        required: false,
        mapsTo: "person_phone",
      },
      {
        label: "Property Type",
        fieldKey: "property_type",
        fieldType: "select",
        required: true,
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
        label: "Property to Audit",
        fieldKey: "property_name",
        fieldType: "text",
        required: false,
        placeholder: "Property name or address",
        helpText: "The single building we'll focus on for the working session.",
      },
      {
        label: "Current Priorities",
        fieldKey: "message",
        fieldType: "textarea",
        required: false,
        placeholder: "Top 1–3 priorities or pain points…",
        mapsTo: "deal_notes",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 5. INSIGHTS NEWSLETTER
  // New surface — for the footer / insights index. Lightweight signup that
  // still creates a contact + deal (so we can attribute newsletter conversions).
  // ---------------------------------------------------------------------
  {
    slug: "insights-newsletter",
    name: "Insights Newsletter",
    description:
      "Owner-controlled CRE insights, delivered. Subscribe to the OpticWise dispatch.",
    submitButtonLabel: "Subscribe",
    successMessage:
      "You're in. Look for the next OpticWise dispatch in your inbox.",
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

// =====================
// Lookups + upsert
// =====================

type ResolvedPipeline = {
  pipelineId: string;
  pipelineName: string;
  stages: { id: string; name: string }[];
};

async function resolvePipeline(): Promise<ResolvedPipeline> {
  const pipeline = await prisma.pipeline.findUnique({
    where: { name: PIPELINE_NAME },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });
  if (!pipeline || pipeline.stages.length === 0) {
    throw new Error(
      `Pipeline "${PIPELINE_NAME}" not found or has no stages. Create it first via the UI.`
    );
  }
  return {
    pipelineId: pipeline.id,
    pipelineName: pipeline.name,
    stages: pipeline.stages.map((s) => ({ id: s.id, name: s.name })),
  };
}

function pickStageId(slug: string, pipeline: ResolvedPipeline): { stageId: string; stageName: string } {
  const preferred = STAGE_FOR_SLUG[slug];
  if (preferred) {
    const match = pipeline.stages.find((s) => s.name === preferred);
    if (match) return { stageId: match.id, stageName: match.name };
  }
  // Fallback to first stage
  const first = pipeline.stages[0];
  return { stageId: first.id, stageName: first.name };
}

async function resolveOwner(): Promise<{ id: string; email: string; name: string | null }> {
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    throw new Error(
      `Owner user not found for ${OWNER_EMAIL}. Make sure that user exists in the User table.`
    );
  }
  return { id: owner.id, email: owner.email, name: owner.name };
}

async function upsertForm(
  def: SeedForm,
  pipelineId: string,
  stageId: string,
  ownerId: string
) {
  const existing = await prisma.form.findUnique({ where: { slug: def.slug } });

  if (existing) {
    // Replace fields wholesale so re-running the seed converges to the spec.
    await prisma.formField.deleteMany({ where: { formId: existing.id } });
    const updated = await prisma.form.update({
      where: { id: existing.id },
      data: {
        name: def.name,
        description: def.description,
        isActive: def.isActive ?? true,
        pipelineId,
        stageId,
        ownerId,
        dealTitleTemplate: def.dealTitleTemplate,
        submitButtonLabel: def.submitButtonLabel,
        successMessage: def.successMessage,
        honeypotFieldName: def.honeypotFieldName ?? "website_url_extra",
        fields: {
          create: def.fields.map((f, i) => ({
            orderIndex: i,
            label: f.label,
            fieldKey: f.fieldKey,
            fieldType: f.fieldType,
            required: f.required,
            placeholder: f.placeholder ?? null,
            helpText: f.helpText ?? null,
            options: (f.options ?? null) as any,
            mapsTo: f.mapsTo ?? null,
          })),
        },
      },
      include: { fields: true },
    });
    return { mode: "updated" as const, form: updated };
  }

  const created = await prisma.form.create({
    data: {
      name: def.name,
      slug: def.slug,
      description: def.description,
      isActive: def.isActive ?? true,
      pipelineId,
      stageId,
      ownerId,
      dealTitleTemplate: def.dealTitleTemplate,
      submitButtonLabel: def.submitButtonLabel,
      successMessage: def.successMessage,
      honeypotFieldName: def.honeypotFieldName ?? "website_url_extra",
      createdById: ownerId,
      fields: {
        create: def.fields.map((f, i) => ({
          orderIndex: i,
          label: f.label,
          fieldKey: f.fieldKey,
          fieldType: f.fieldType,
          required: f.required,
          placeholder: f.placeholder ?? null,
          helpText: f.helpText ?? null,
          options: (f.options ?? null) as any,
          mapsTo: f.mapsTo ?? null,
        })),
      },
    },
    include: { fields: true },
  });
  return { mode: "created" as const, form: created };
}

async function main() {
  console.log("\nSeeding opticwise.com forms into OW Form Builder\n");
  console.log("=".repeat(72));

  const pipeline = await resolvePipeline();
  const owner = await resolveOwner();

  console.log(`Pipeline: ${pipeline.pipelineName} (${pipeline.pipelineId})`);
  console.log(`Stages:   ${pipeline.stages.map((s) => s.name).join(", ")}`);
  console.log(`Owner:    ${owner.name || owner.email} (${owner.id})`);
  console.log("=".repeat(72));

  let createdCount = 0;
  let updatedCount = 0;

  for (const def of FORMS) {
    try {
      const { stageId, stageName } = pickStageId(def.slug, pipeline);
      const { mode, form } = await upsertForm(def, pipeline.pipelineId, stageId, owner.id);
      if (mode === "created") createdCount += 1;
      else updatedCount += 1;
      console.log(
        `  ${mode === "created" ? "+" : "~"} [${def.slug.padEnd(22)}] ${form.name.padEnd(32)} -> ${stageName}  (${form.fields.length} fields)`
      );
    } catch (err) {
      console.error(`  ! Failed to seed [${def.slug}]:`, err);
      throw err;
    }
  }

  console.log("=".repeat(72));
  console.log(`Done. Created ${createdCount}, updated ${updatedCount}.`);
  console.log(`\nView forms at: https://ownet.opticwise.com/forms\n`);
}

main()
  .catch((e) => {
    console.error("\nSeed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
