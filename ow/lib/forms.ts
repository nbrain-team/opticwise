import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import type { FormFieldMapping, FormFieldType, Prisma } from "@prisma/client";

// =====================
// Types shared between API + UI
// =====================

export const FORM_FIELD_TYPES: FormFieldType[] = [
  "text",
  "email",
  "tel",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "number",
  "url",
  "date",
];

export const FORM_FIELD_MAPPINGS: { value: FormFieldMapping | "none"; label: string }[] = [
  { value: "none", label: "Custom — store on submission only" },
  { value: "person_firstName", label: "Contact — First name" },
  { value: "person_lastName", label: "Contact — Last name" },
  { value: "person_email", label: "Contact — Email" },
  { value: "person_phone", label: "Contact — Phone" },
  { value: "person_title", label: "Contact — Job title" },
  { value: "organization_name", label: "Company — Name" },
  { value: "organization_websiteUrl", label: "Company — Website URL" },
  { value: "organization_domain", label: "Company — Domain" },
  { value: "deal_notes", label: "Deal — Notes / message" },
];

export type FormFieldOption = { label: string; value: string };

export type FormFieldInput = {
  id?: string;
  label: string;
  fieldKey: string;
  fieldType: FormFieldType;
  required: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options?: FormFieldOption[] | null;
  mapsTo?: FormFieldMapping | null;
  orderIndex: number;
};

export type FormInput = {
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  pipelineId: string;
  stageId: string;
  ownerId: string;
  dealTitleTemplate: string;
  submitButtonLabel: string;
  successMessage: string;
  honeypotFieldName: string;
  // Confirmation email sent to the submitter after successful submission.
  // When `confirmationEmailEnabled` is true, the email is rendered with merge
  // tags and sent FROM bill@opticwise.com (display name configurable).
  confirmationEmailEnabled: boolean;
  confirmationEmailSubject?: string | null;
  confirmationEmailFromName?: string | null;
  confirmationEmailReplyTo?: string | null;
  confirmationEmailHtml?: string | null;
  fields: FormFieldInput[];
};

// =====================
// Helpers
// =====================

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function fieldKeyFromLabel(label: string): string {
  const cleaned = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return cleaned || "field";
}

/**
 * Strip HTML tags and decode common entities for length validation only.
 * Not for sanitization — the email body is rendered as-is into the outgoing
 * email since it's authored by an authenticated CRM admin.
 */
function stripHtmlForValidation(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Render a deal-title template like "{formName} — {firstName} {lastName} @ {company}"
 * against the values from a submission. Unknown tokens become an empty string,
 * and we then collapse stray whitespace / orphan punctuation so titles stay clean.
 */
export function renderTemplate(
  template: string,
  values: Record<string, string | undefined>
): string {
  let out = template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = values[key];
    return v === undefined || v === null ? "" : String(v);
  });
  // Tidy: collapse multiple spaces, fix " @ " with empty company, etc.
  out = out
    .replace(/\s+@\s*$/g, "")
    .replace(/—\s*$/g, "")
    .replace(/—\s*@/g, "—")
    .replace(/\s{2,}/g, " ")
    .trim();
  return out || "Form submission";
}

/**
 * Validate the structural correctness of a FormInput before persisting.
 * Returns array of human-readable error messages; empty array = OK.
 */
export function validateFormInput(input: FormInput): string[] {
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push("Form name is required.");
  if (!input.slug?.trim()) errors.push("Slug is required.");
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    errors.push("Slug must contain only lowercase letters, numbers, and hyphens.");
  }
  if (!input.pipelineId) errors.push("Pipeline is required.");
  if (!input.stageId) errors.push("Stage is required.");
  if (!input.ownerId) errors.push("Owner is required.");
  if (!input.dealTitleTemplate?.trim()) errors.push("Deal title template is required.");
  if (!input.honeypotFieldName?.trim()) errors.push("Honeypot field name is required.");

  if (input.confirmationEmailEnabled) {
    if (!input.confirmationEmailSubject?.trim()) {
      errors.push("Confirmation email subject is required when confirmation emails are enabled.");
    }
    if (!input.confirmationEmailHtml?.trim() || stripHtmlForValidation(input.confirmationEmailHtml).length < 10) {
      errors.push("Confirmation email body is required (write the message you want to send the submitter).");
    }
    if (input.confirmationEmailReplyTo && input.confirmationEmailReplyTo.trim()) {
      const replyTo = input.confirmationEmailReplyTo.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
        errors.push("Confirmation email reply-to must be a valid email address.");
      }
    }
  }

  if (!Array.isArray(input.fields) || input.fields.length === 0) {
    errors.push("Add at least one form field.");
  } else {
    const keys = new Set<string>();
    input.fields.forEach((f, i) => {
      const idx = i + 1;
      if (!f.label?.trim()) errors.push(`Field ${idx}: label is required.`);
      if (!f.fieldKey?.trim()) errors.push(`Field ${idx}: key is required.`);
      if (!/^[a-z0-9_]+$/i.test(f.fieldKey)) {
        errors.push(`Field ${idx}: key must contain only letters, numbers, and underscores.`);
      }
      if (keys.has(f.fieldKey)) errors.push(`Field ${idx}: duplicate key "${f.fieldKey}".`);
      keys.add(f.fieldKey);
      if (f.fieldKey === input.honeypotFieldName) {
        errors.push(`Field ${idx}: key conflicts with honeypot field name.`);
      }
      if (["select", "radio", "checkbox"].includes(f.fieldType)) {
        if (!f.options || f.options.length === 0) {
          errors.push(`Field ${idx}: ${f.fieldType} field requires at least one option.`);
        }
      }
    });
  }

  return errors;
}

// =====================
// Submission processing
// Find-or-create Org → find-or-create Person → create Deal → store submission
// =====================

export type SubmissionContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  pageUrl?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
};

export type ProcessedSubmissionResult =
  | { ok: true; submissionId: string; dealId: string; personId: string | null; organizationId: string | null }
  | { ok: false; submissionId: string; error: string };

/**
 * Look up form by slug for public consumption — caller is responsible for
 * filtering to active forms.
 */
export async function getFormBySlugWithFields(slug: string) {
  return prisma.form.findUnique({
    where: { slug },
    include: {
      fields: { orderBy: { orderIndex: "asc" } },
    },
  });
}

type FormForProcessing = NonNullable<Awaited<ReturnType<typeof getFormBySlugWithFields>>>;

/**
 * Heuristically guess a CRM mapping from a field's key + label when the form
 * admin didn't explicitly set `mapsTo`. Lets us still create a Person/Org
 * even when the form was built quickly without the mapping configured.
 *
 * Only used as a fallback. Explicit `mapsTo` always wins.
 */
function guessMapping(fieldKey: string, label: string): FormFieldMapping | null {
  const haystack = `${fieldKey} ${label}`.toLowerCase();
  // Email
  if (/(^|[^a-z])e[\W_-]?mail([^a-z]|$)/.test(haystack) || /e_?mail/.test(haystack)) {
    return "person_email";
  }
  // First name
  if (/\b(first[\W_-]?name|fname|given[\W_-]?name)\b/.test(haystack)) {
    return "person_firstName";
  }
  // Last name
  if (/\b(last[\W_-]?name|lname|surname|family[\W_-]?name)\b/.test(haystack)) {
    return "person_lastName";
  }
  // Full name (we'll split it downstream)
  if (/^name$|\bfull[\W_-]?name\b|\byour[\W_-]?name\b/.test(haystack)) {
    return "person_firstName"; // marker — will be split into first/last below
  }
  // Phone
  if (/\b(phone|tel|mobile|cell|contact[\W_-]?number)\b/.test(haystack)) {
    return "person_phone";
  }
  // Title / role
  if (/\b(job[\W_-]?title|title|position|role)\b/.test(haystack) && !/company|org|business/.test(haystack)) {
    return "person_title";
  }
  // Company / org
  if (/\b(company|organization|organisation|business|employer|firm)\b/.test(haystack) && !/website|url|domain/.test(haystack)) {
    return "organization_name";
  }
  // Website / URL
  if (/\b(website|web[\W_-]?site|url|company[\W_-]?url)\b/.test(haystack)) {
    return "organization_websiteUrl";
  }
  // Domain
  if (/\bdomain\b/.test(haystack)) {
    return "organization_domain";
  }
  // Notes / message
  if (/\b(message|notes?|comments?|tell[\W_-]?us|how[\W_-]?can|inquiry)\b/.test(haystack)) {
    return "deal_notes";
  }
  return null;
}

/**
 * Pull mapped values out of the raw submission payload, keyed by mapping
 * target. Falls back to heuristic mapping when the field has no explicit
 * `mapsTo` set, so contacts/companies still get created when the form admin
 * forgot to configure the CRM mapping.
 */
function extractMapped(
  form: FormForProcessing,
  payload: Record<string, unknown>
): Record<FormFieldMapping, string | undefined> {
  const out = {} as Record<FormFieldMapping, string | undefined>;
  for (const field of form.fields) {
    const raw = payload[field.fieldKey];
    if (raw === undefined || raw === null) continue;
    const v = Array.isArray(raw) ? raw.join(", ") : String(raw);
    if (!v.trim()) continue;

    const mapping: FormFieldMapping | null =
      field.mapsTo ?? guessMapping(field.fieldKey, field.label);
    if (!mapping) continue;

    // Special case: if a single "Name" field is mapped to firstName, split it.
    if (mapping === "person_firstName" && !field.mapsTo) {
      const fullName = v.trim();
      const looksLikeFullName =
        /\s/.test(fullName) && !/^(first|f)[\W_-]?name?$/i.test(field.fieldKey);
      if (looksLikeFullName) {
        const parts = fullName.split(/\s+/);
        if (!out.person_firstName) out.person_firstName = parts[0];
        if (!out.person_lastName) out.person_lastName = parts.slice(1).join(" ");
        continue;
      }
    }

    // Don't let heuristic mapping overwrite an explicit one already set
    if (out[mapping]) continue;
    out[mapping] = v.trim();
  }
  return out;
}

/**
 * Process a submission: store it, find-or-create Org + Person, create Deal.
 * Best-effort owner notification via sendEmail() (errors logged but not fatal).
 */
export async function processFormSubmission(
  form: FormForProcessing,
  rawPayload: Record<string, unknown>,
  context: SubmissionContext
): Promise<ProcessedSubmissionResult> {
  // Honeypot check — if the bot field is non-empty, mark spam and exit early.
  const honeypotValue = rawPayload[form.honeypotFieldName];
  if (honeypotValue !== undefined && honeypotValue !== null && String(honeypotValue).trim() !== "") {
    const spam = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        rawData: rawPayload as Prisma.InputJsonValue,
        status: "spam",
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        referrer: context.referrer ?? null,
        pageUrl: context.pageUrl ?? null,
        utmSource: context.utmSource ?? null,
        utmMedium: context.utmMedium ?? null,
        utmCampaign: context.utmCampaign ?? null,
        utmTerm: context.utmTerm ?? null,
        utmContent: context.utmContent ?? null,
      },
    });
    return { ok: false, submissionId: spam.id, error: "Submission flagged as spam." };
  }

  // Strip honeypot from raw before storing
  const cleanPayload: Record<string, unknown> = { ...rawPayload };
  delete cleanPayload[form.honeypotFieldName];

  const mapped = extractMapped(form, cleanPayload);

  // Last-resort: scan all values for an email-shaped string if no email was
  // mapped. Lets us still create a contact when a form has no email field
  // mapping but the visitor typed their email somewhere in a text field.
  if (!mapped.person_email) {
    for (const v of Object.values(cleanPayload)) {
      if (typeof v !== "string") continue;
      const m = v.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
      if (m) {
        mapped.person_email = m[0].toLowerCase();
        break;
      }
    }
  }

  console.log("[forms] processing submission for slug=", form.slug, "mapped=", {
    hasEmail: !!mapped.person_email,
    hasFirstName: !!mapped.person_firstName,
    hasLastName: !!mapped.person_lastName,
    hasCompany: !!mapped.organization_name,
  });

  try {
    // ----- Organization (find-or-create by name) -----
    let organizationId: string | null = null;
    const orgName = mapped.organization_name?.trim();
    if (orgName) {
      const org = await prisma.organization.upsert({
        where: { name: orgName },
        create: {
          name: orgName,
          websiteUrl: mapped.organization_websiteUrl ?? null,
          domain: mapped.organization_domain ?? null,
        },
        update: {
          websiteUrl: mapped.organization_websiteUrl ?? undefined,
          domain: mapped.organization_domain ?? undefined,
        },
      });
      organizationId = org.id;
    }

    // ----- Person (find-or-create) -----
    // Prefer email match (Person.email is unique). Fallback to name + org.
    let personId: string | null = null;
    const email = mapped.person_email?.trim().toLowerCase();
    const firstName = mapped.person_firstName?.trim() || "";
    const lastName = mapped.person_lastName?.trim() || "";
    const phone = mapped.person_phone?.trim() || null;
    const title = mapped.person_title?.trim() || null;

    if (email || firstName || lastName) {
      let existing = email ? await prisma.person.findUnique({ where: { email } }) : null;
      if (!existing && (firstName || lastName) && organizationId) {
        existing = await prisma.person.findFirst({
          where: {
            firstName: firstName || "",
            lastName: lastName || "",
            organizationId,
          },
        });
      }

      if (existing) {
        const update: Prisma.PersonUpdateInput = {};
        if (firstName && !existing.firstName) update.firstName = firstName;
        if (lastName && !existing.lastName) update.lastName = lastName;
        if (phone && !existing.phone) update.phone = phone;
        if (title && !existing.title) update.title = title;
        if (organizationId && !existing.organizationId) {
          update.organization = { connect: { id: organizationId } };
        }
        if (Object.keys(update).length > 0) {
          await prisma.person.update({ where: { id: existing.id }, data: update });
        }
        personId = existing.id;
      } else {
        const created = await prisma.person.create({
          data: {
            firstName: firstName || (email ? email.split("@")[0] : "Unknown"),
            lastName: lastName || "",
            name:
              `${firstName} ${lastName}`.trim() ||
              (email ? email.split("@")[0] : "Unknown contact"),
            email: email ?? null,
            phone,
            title,
            organizationId: organizationId ?? undefined,
          },
        });
        personId = created.id;
      }
    }

    // ----- Deal -----
    const dealTitle = renderTemplate(form.dealTitleTemplate, {
      formName: form.name,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      email: email ?? "",
      company: orgName ?? "",
      phone: phone ?? "",
      title: title ?? "",
    });

    // Position = max(position) + 1 within the chosen stage
    const maxPos = await prisma.deal.aggregate({
      where: { stageId: form.stageId, pipelineId: form.pipelineId },
      _max: { position: true },
    });
    const nextPos = (maxPos._max.position ?? 0) + 1;

    // Custom field bag = ALL submission values (so the data lives on the deal too,
    // not just on the FormSubmission row). This makes the deal self-contained.
    const customFields: Record<string, unknown> = {
      _formSlug: form.slug,
      _formName: form.name,
      ...cleanPayload,
    };

    const deal = await prisma.deal.create({
      data: {
        title: dealTitle,
        value: 0,
        currency: "USD",
        pipelineId: form.pipelineId,
        stageId: form.stageId,
        position: nextPos,
        organizationId: organizationId ?? undefined,
        personId: personId ?? undefined,
        ownerId: form.ownerId,
        leadSource: `Form: ${form.name}`,
        sourceChannel: "website_form",
        sourceChannelId: form.slug,
        sourceOrigin: context.utmSource ?? null,
        sourceOriginId: context.utmCampaign ?? null,
        customFields: customFields as Prisma.InputJsonValue,
      },
    });

    // ----- DealContact (Stakeholder) -----
    // The deal page's "Stakeholders" section is powered by the DealContact
    // junction table — separate from the legacy Deal.personId pointer.
    // We always add the form submitter as a stakeholder marked primary so
    // they appear in the Stakeholders list immediately.
    if (personId) {
      try {
        await prisma.dealContact.upsert({
          where: { dealId_personId: { dealId: deal.id, personId } },
          create: {
            dealId: deal.id,
            personId,
            isPrimary: true,
            role: null,
            notes: `Auto-added from website form: ${form.name}`,
          },
          update: {},
        });
      } catch (dcErr) {
        console.error("[forms] failed to create DealContact stakeholder:", dcErr);
      }
    } else {
      console.warn(
        "[forms] no person was created/matched — deal has no stakeholder. " +
          "Form may be missing person_email / person_firstName / person_lastName field mappings.",
        { formSlug: form.slug, formId: form.id }
      );
    }

    // ----- Persist submission row -----
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        rawData: cleanPayload as Prisma.InputJsonValue,
        status: "processed",
        personId,
        organizationId,
        dealId: deal.id,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        referrer: context.referrer ?? null,
        pageUrl: context.pageUrl ?? null,
        utmSource: context.utmSource ?? null,
        utmMedium: context.utmMedium ?? null,
        utmCampaign: context.utmCampaign ?? null,
        utmTerm: context.utmTerm ?? null,
        utmContent: context.utmContent ?? null,
      },
    });

    // ----- Owner email notification (best-effort) -----
    notifyOwner(form, deal.id, dealTitle, cleanPayload, mapped).catch((err) => {
      console.error("[forms] owner email notification failed:", err);
    });

    // ----- Confirmation email to the submitter (best-effort) -----
    // Only fires when the form admin has opted in AND the submitter provided
    // an email address. We never block submission on email failure.
    if (form.confirmationEmailEnabled && mapped.person_email) {
      sendSubmitterConfirmation(form, mapped.person_email, mapped, cleanPayload).catch((err) => {
        console.error("[forms] submitter confirmation email failed:", err);
      });
    }

    return {
      ok: true,
      submissionId: submission.id,
      dealId: deal.id,
      personId,
      organizationId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[forms] submission processing failed:", err);
    const failed = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        rawData: cleanPayload as Prisma.InputJsonValue,
        status: "failed",
        errorMessage: message,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        referrer: context.referrer ?? null,
        pageUrl: context.pageUrl ?? null,
        utmSource: context.utmSource ?? null,
        utmMedium: context.utmMedium ?? null,
        utmCampaign: context.utmCampaign ?? null,
        utmTerm: context.utmTerm ?? null,
        utmContent: context.utmContent ?? null,
      },
    });
    return { ok: false, submissionId: failed.id, error: message };
  }
}

async function notifyOwner(
  form: FormForProcessing,
  dealId: string,
  dealTitle: string,
  payload: Record<string, unknown>,
  mapped: Record<FormFieldMapping, string | undefined>
) {
  const owner = await prisma.user.findUnique({ where: { id: form.ownerId } });
  if (!owner?.email || !owner.isActive) return;

  const platformUrl = (process.env.PLATFORM_PUBLIC_URL || "https://ownet.opticwise.com").replace(
    /\/+$/,
    ""
  );
  const dealLink = `${platformUrl}/deal/${dealId}`;

  // Build a clean field table
  const rows = form.fields
    .map((f) => {
      const v = payload[f.fieldKey];
      if (v === undefined || v === null || v === "") return null;
      const display = Array.isArray(v) ? v.join(", ") : String(v);
      return `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#666;font-size:13px;width:200px;vertical-align:top;">${escapeHtml(
        f.label
      )}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${escapeHtml(
        display
      )}</td></tr>`;
    })
    .filter(Boolean)
    .join("");

  const subjectName = [mapped.person_firstName, mapped.person_lastName].filter(Boolean).join(" ");
  const subjectCompany = mapped.organization_name ? ` @ ${mapped.organization_name}` : "";
  const subject = `New form submission: ${form.name} — ${subjectName || "(no name)"}${subjectCompany}`;

  const html = `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a2434;">
  <div style="border-top:4px solid #3B6B8F;background:#fff;padding:24px;">
    <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#3B6B8F;margin:0 0 8px;">OpticWise · New Form Submission</p>
    <h1 style="font-size:18px;margin:0 0 4px;color:#0a1628;">${escapeHtml(form.name)}</h1>
    <p style="font-size:13px;color:#666;margin:0 0 18px;">A new lead was just captured from <strong>opticwise.com</strong>. A deal has been created and assigned to you.</p>
    <div style="background:#f7f5f1;border:1px solid #e3ddd1;border-radius:6px;padding:14px 18px;margin-bottom:18px;">
      <div style="font-size:12px;color:#666;margin-bottom:4px;">Deal created</div>
      <div style="font-size:14px;font-weight:600;color:#0a1628;margin-bottom:10px;">${escapeHtml(dealTitle)}</div>
      <a href="${dealLink}" style="display:inline-block;background:#3B6B8F;color:#fff;text-decoration:none;padding:8px 16px;border-radius:5px;font-size:13px;font-weight:600;">Open deal in OpticWise →</a>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#fff;">
      ${rows || `<tr><td style="padding:8px 12px;color:#999;font-size:13px;">No field values submitted.</td></tr>`}
    </table>
  </div>
</div>`;

  await sendEmail({
    to: owner.email,
    subject,
    htmlBody: html,
    textBody: `New form submission: ${form.name}\nDeal: ${dealTitle}\nOpen: ${dealLink}`,
  });
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build the merge-tag dictionary used to render the confirmation email's
 * subject and HTML body. Includes both the standard mapped fields and every
 * raw form field by its `fieldKey`, so admins can reference any submitted
 * value with `{fieldKey}` syntax.
 */
function buildEmailMergeValues(
  form: FormForProcessing,
  mapped: Record<FormFieldMapping, string | undefined>,
  payload: Record<string, unknown>
): Record<string, string> {
  const firstName = mapped.person_firstName?.trim() || "";
  const lastName = mapped.person_lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const out: Record<string, string> = {
    formName: form.name,
    firstName,
    lastName,
    fullName,
    name: fullName || firstName,
    email: mapped.person_email?.trim() || "",
    phone: mapped.person_phone?.trim() || "",
    title: mapped.person_title?.trim() || "",
    company: mapped.organization_name?.trim() || "",
    website: mapped.organization_websiteUrl?.trim() || "",
  };

  // Surface every raw form field by its key so the admin can use {fieldKey}
  // for any custom field they added to the form.
  for (const field of form.fields) {
    const v = payload[field.fieldKey];
    if (v === undefined || v === null) continue;
    const display = Array.isArray(v) ? v.join(", ") : String(v);
    out[field.fieldKey] = display;
  }

  return out;
}

/**
 * Render a string template with `{tag}` placeholders. Unknown tags become
 * empty strings; whitespace is collapsed at the end so partial values don't
 * leave stray gaps.
 */
function renderEmailTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = values[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

/**
 * Send the templated confirmation email to the form submitter.
 * Best-effort — failures are logged but never block the submission flow.
 *
 * The email is sent from `bill@opticwise.com` (via the existing service
 * account in lib/email.ts). The display name and reply-to are configurable
 * per form so different forms can use different from-names if needed.
 */
async function sendSubmitterConfirmation(
  form: FormForProcessing,
  toEmail: string,
  mapped: Record<FormFieldMapping, string | undefined>,
  payload: Record<string, unknown>
) {
  if (!form.confirmationEmailEnabled) return;
  if (!form.confirmationEmailHtml?.trim()) return;
  if (!form.confirmationEmailSubject?.trim()) return;

  const values = buildEmailMergeValues(form, mapped, payload);
  const subject = renderEmailTemplate(form.confirmationEmailSubject, values);
  const htmlBodyContent = renderEmailTemplate(form.confirmationEmailHtml, values);

  // Wrap the admin's HTML in a clean responsive container so emails render
  // consistently across clients (Gmail strips <head>, etc.).
  const wrappedHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1a2434;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.06);max-width:600px;width:100%;">
          <tr>
            <td style="padding:32px 36px;font-size:15px;line-height:1.6;color:#1a2434;">
              ${htmlBodyContent}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text fallback derived from the HTML — strips tags and collapses
  // whitespace. Good enough for clients that prefer text/plain.
  const textBody = stripHtmlForValidation(htmlBodyContent);

  const fromName = (form.confirmationEmailFromName || "Bill Demas").trim();
  const replyTo = form.confirmationEmailReplyTo?.trim() || null;

  await sendEmail({
    to: toEmail,
    subject,
    htmlBody: wrappedHtml,
    textBody,
    fromName,
    replyTo,
  });
}
