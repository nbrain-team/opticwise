"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Local mirrors of types that live in /lib/forms.ts. We re-declare them here
// so this file has no server imports (pure client component).

const FIELD_TYPES = [
  { value: "text", label: "Single-line text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "textarea", label: "Multi-line text" },
  { value: "select", label: "Dropdown (select one)" },
  { value: "radio", label: "Radio buttons (select one)" },
  { value: "checkbox", label: "Checkboxes (select multiple)" },
  { value: "number", label: "Number" },
  { value: "url", label: "URL" },
  { value: "date", label: "Date" },
] as const;

const MAPPING_OPTIONS = [
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
] as const;

type FieldType = (typeof FIELD_TYPES)[number]["value"];
type Mapping = (typeof MAPPING_OPTIONS)[number]["value"];

type FormField = {
  id?: string;
  label: string;
  fieldKey: string;
  fieldType: FieldType;
  required: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options?: { label: string; value: string }[] | null;
  mapsTo: Mapping;
};

type FormShape = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  pipelineId: string;
  stageId: string;
  ownerId: string;
  dealTitleTemplate: string;
  submitButtonLabel: string;
  successMessage: string;
  honeypotFieldName: string;
  fields: FormField[];
};

type Lookups = {
  pipelines: { id: string; name: string; stages: { id: string; name: string }[] }[];
  users: { id: string; name: string | null; email: string }[];
};

const DEFAULT_FORM: FormShape = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
  pipelineId: "",
  stageId: "",
  ownerId: "",
  dealTitleTemplate: "{formName} — {firstName} {lastName} @ {company}",
  submitButtonLabel: "Submit",
  successMessage: "Thanks — we'll be in touch shortly.",
  honeypotFieldName: "website_url_extra",
  fields: [
    starterField("First name", "first_name", "text", "person_firstName", true),
    starterField("Last name", "last_name", "text", "person_lastName", true),
    starterField("Work email", "email", "email", "person_email", true),
    starterField("Company", "company", "text", "organization_name", true),
    starterField("Message", "message", "textarea", "deal_notes", false),
  ],
};

function starterField(
  label: string,
  key: string,
  type: FieldType,
  mapsTo: Mapping,
  required: boolean
): FormField {
  return {
    label,
    fieldKey: key,
    fieldType: type,
    required,
    placeholder: null,
    helpText: null,
    options: null,
    mapsTo,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function fieldKeyFromLabel(label: string): string {
  const v = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return v || "field";
}

export default function FormEditor({
  initialForm,
  formId,
  publicHost,
}: {
  initialForm?: FormShape;
  formId?: string;
  publicHost: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormShape>(initialForm ?? DEFAULT_FORM);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!initialForm);

  useEffect(() => {
    fetch("/api/forms/lookups")
      .then((r) => r.json())
      .then((data) => setLookups(data))
      .catch(() => setError("Failed to load pipelines and users."));
  }, []);

  // Auto-derive slug from name on first edit
  useEffect(() => {
    if (!slugTouched && form.name) {
      setForm((f) => ({ ...f, slug: slugify(form.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  const stages = useMemo(() => {
    if (!lookups || !form.pipelineId) return [];
    return lookups.pipelines.find((p) => p.id === form.pipelineId)?.stages ?? [];
  }, [lookups, form.pipelineId]);

  // Reset stageId when pipeline changes if current stage is no longer valid
  useEffect(() => {
    if (form.stageId && stages.length > 0 && !stages.find((s) => s.id === form.stageId)) {
      setForm((f) => ({ ...f, stageId: "" }));
    }
  }, [stages, form.stageId]);

  const mergeTags = useMemo(() => {
    const base = ["formName", "firstName", "lastName", "fullName", "email", "company", "phone", "title"];
    const fieldKeys = form.fields.map((f) => f.fieldKey).filter(Boolean);
    return Array.from(new Set([...base, ...fieldKeys]));
  }, [form.fields]);

  function update<K extends keyof FormShape>(key: K, value: FormShape[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateField(idx: number, patch: Partial<FormField>) {
    setForm((f) => ({
      ...f,
      fields: f.fields.map((field, i) => (i === idx ? { ...field, ...patch } : field)),
    }));
  }

  function addField() {
    setForm((f) => ({
      ...f,
      fields: [
        ...f.fields,
        {
          label: "New field",
          fieldKey: `field_${f.fields.length + 1}`,
          fieldType: "text",
          required: false,
          placeholder: null,
          helpText: null,
          options: null,
          mapsTo: "none",
        },
      ],
    }));
  }

  function removeField(idx: number) {
    setForm((f) => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }));
  }

  function moveField(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= form.fields.length) return;
    setForm((f) => {
      const next = [...f.fields];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...f, fields: next };
    });
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        fields: form.fields.map((f, i) => ({
          ...f,
          orderIndex: i,
          mapsTo: f.mapsTo === "none" ? null : f.mapsTo,
          options: ["select", "radio", "checkbox"].includes(f.fieldType)
            ? f.options ?? []
            : null,
        })),
      };

      const res = await fetch(formId ? `/api/forms/${formId}` : "/api/forms", {
        method: formId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (!formId && data.form?.id) {
        router.push(`/forms/${data.form.id}`);
      } else {
        router.refresh();
        // Brief feedback
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!formId) return;
    if (!confirm("Deactivate this form? It will stop accepting submissions but past submissions will remain.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deactivate failed");
      router.push("/forms");
    } finally {
      setLoading(false);
    }
  }

  const embedSnippet = `<FormEmbed formSlug="${form.slug || "your-slug"}" />`;
  const publicGetUrl = `${publicHost}/api/public/forms/${form.slug || "your-slug"}`;
  const publicPostUrl = `${publicHost}/api/public/forms/${form.slug || "your-slug"}/submit`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/forms" className="text-[#3B6B8F] hover:text-[#2E5570] text-sm font-medium">
          ← Back to Forms
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {formId ? "Edit Form" : "Create New Form"}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Submissions create a contact + company and a new deal in your chosen pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {formId && (
            <button
              onClick={handleDeactivate}
              disabled={loading}
              className="text-sm text-red-600 hover:text-red-700 px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Deactivate
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#3B6B8F] text-white px-6 py-2.5 rounded-lg hover:bg-[#2E5570] font-medium disabled:opacity-50"
          >
            {loading ? "Saving…" : formId ? "Save Changes" : "Create Form"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* SECTION 1 — Basics */}
      <Section title="Basics" subtitle="Name, slug, status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Form name *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="ow-input"
              placeholder="e.g. Demo Request"
            />
          </Field>
          <Field
            label="Slug *"
            help="Used in the embed and the public URL. Lowercase, hyphens only."
          >
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", slugify(e.target.value));
              }}
              className="ow-input font-mono text-sm"
              placeholder="demo-request"
            />
          </Field>
        </div>
        <Field label="Description (internal only)">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={2}
            className="ow-input"
            placeholder="What this form is for. Not shown to visitors."
          />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="h-4 w-4"
          />
          Form is active and accepting submissions
        </label>
      </Section>

      {/* SECTION 2 — Routing & Deal */}
      <Section
        title="Routing & Deal"
        subtitle="Where new submissions land and how the deal is named"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Pipeline *">
            <select
              value={form.pipelineId}
              onChange={(e) => update("pipelineId", e.target.value)}
              className="ow-input"
              disabled={!lookups}
            >
              <option value="">Select pipeline…</option>
              {lookups?.pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stage *">
            <select
              value={form.stageId}
              onChange={(e) => update("stageId", e.target.value)}
              className="ow-input"
              disabled={stages.length === 0}
            >
              <option value="">Select stage…</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Deal owner *">
            <select
              value={form.ownerId}
              onChange={(e) => update("ownerId", e.target.value)}
              className="ow-input"
              disabled={!lookups}
            >
              <option value="">Select owner…</option>
              {lookups?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Deal title template"
          help="Use merge tags in curly braces. Available below."
        >
          <input
            type="text"
            value={form.dealTitleTemplate}
            onChange={(e) => update("dealTitleTemplate", e.target.value)}
            className="ow-input font-mono text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mergeTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  update(
                    "dealTitleTemplate",
                    `${form.dealTitleTemplate} {${tag}}`.trim()
                  )
                }
                className="text-[11px] font-mono bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
              >
                {`{${tag}}`}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* SECTION 3 — Fields */}
      <Section
        title="Fields"
        subtitle="Define the form fields and how they map to the CRM"
        action={
          <button
            type="button"
            onClick={addField}
            className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            + Add field
          </button>
        }
      >
        <div className="space-y-3">
          {form.fields.map((field, idx) => (
            <FieldRow
              key={idx}
              idx={idx}
              field={field}
              total={form.fields.length}
              onChange={(patch) => updateField(idx, patch)}
              onRemove={() => removeField(idx)}
              onMove={(dir) => moveField(idx, dir)}
            />
          ))}
        </div>
        {form.fields.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No fields yet. Click &quot;Add field&quot; above to start.
          </p>
        )}
      </Section>

      {/* SECTION 4 — Submission UX */}
      <Section title="Submission Experience" subtitle="What the visitor sees on submit">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Submit button label">
            <input
              type="text"
              value={form.submitButtonLabel}
              onChange={(e) => update("submitButtonLabel", e.target.value)}
              className="ow-input"
            />
          </Field>
          <Field label="Honeypot field name (anti-spam)">
            <input
              type="text"
              value={form.honeypotFieldName}
              onChange={(e) => update("honeypotFieldName", e.target.value)}
              className="ow-input font-mono text-sm"
            />
          </Field>
        </div>
        <Field label="Success message">
          <textarea
            value={form.successMessage}
            onChange={(e) => update("successMessage", e.target.value)}
            rows={2}
            className="ow-input"
          />
        </Field>
      </Section>

      {/* SECTION 5 — Embed */}
      <Section
        title="Embed on opticwise.com"
        subtitle="Drop this block into any page in the Payload CMS"
      >
        <p className="text-sm text-gray-600 mb-4">
          In Payload, edit any page, add a <strong>FormEmbed</strong> block, and set the
          slug to <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">{form.slug || "(set slug above)"}</code>.
        </p>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <div className="text-gray-500 mb-1">{`// Block config in Payload`}</div>
          <div>{embedSnippet}</div>
          <div className="mt-3 text-gray-500">{`// Public API used by the marketing site`}</div>
          <div className="text-blue-300">GET {publicGetUrl}</div>
          <div className="text-emerald-300">POST {publicPostUrl}</div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    </div>
  );
}

function FieldRow({
  idx,
  field,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  idx: number;
  field: FormField;
  total: number;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const isOptionField = ["select", "radio", "checkbox"].includes(field.fieldType);
  const opts = field.options ?? [];

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">#{idx + 1}</span>
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={idx === 0}
            className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed px-1"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={idx === total - 1}
            className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed px-1"
            aria-label="Move down"
          >
            ↓
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => {
              const newLabel = e.target.value;
              const patch: Partial<FormField> = { label: newLabel };
              // Auto-update fieldKey only if it still looks auto-generated
              if (
                !field.fieldKey ||
                field.fieldKey === fieldKeyFromLabel(field.label)
              ) {
                patch.fieldKey = fieldKeyFromLabel(newLabel);
              }
              onChange(patch);
            }}
            className="ow-input"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Key</label>
          <input
            type="text"
            value={field.fieldKey}
            onChange={(e) =>
              onChange({ fieldKey: e.target.value.replace(/[^a-z0-9_]/gi, "_") })
            }
            className="ow-input font-mono text-xs"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={field.fieldType}
            onChange={(e) => onChange({ fieldType: e.target.value as FieldType })}
            className="ow-input"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 flex items-end">
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="h-4 w-4"
            />
            Required
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
        <div className="md:col-span-6">
          <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder ?? ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            className="ow-input"
          />
        </div>
        <div className="md:col-span-6">
          <label className="block text-xs font-medium text-gray-600 mb-1">Help text</label>
          <input
            type="text"
            value={field.helpText ?? ""}
            onChange={(e) => onChange({ helpText: e.target.value })}
            className="ow-input"
          />
        </div>
      </div>

      <div className="mb-1">
        <label className="block text-xs font-medium text-gray-600 mb-1">Maps to CRM</label>
        <select
          value={field.mapsTo}
          onChange={(e) => onChange({ mapsTo: e.target.value as Mapping })}
          className="ow-input"
        >
          {MAPPING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isOptionField && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-600">Options</label>
            <button
              type="button"
              onClick={() =>
                onChange({
                  options: [...opts, { label: "", value: "" }],
                })
              }
              className="text-xs text-[#3B6B8F] hover:underline"
            >
              + Add option
            </button>
          </div>
          {opts.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Add at least one option.</p>
          ) : (
            <div className="space-y-2">
              {opts.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Label shown to visitor"
                    value={o.label}
                    onChange={(e) => {
                      const next = [...opts];
                      next[oi] = { ...next[oi], label: e.target.value };
                      // auto-fill value if empty
                      if (!next[oi].value) {
                        next[oi].value = e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "_");
                      }
                      onChange({ options: next });
                    }}
                    className="ow-input flex-1"
                  />
                  <input
                    type="text"
                    placeholder="value"
                    value={o.value}
                    onChange={(e) => {
                      const next = [...opts];
                      next[oi] = { ...next[oi], value: e.target.value };
                      onChange({ options: next });
                    }}
                    className="ow-input w-32 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        options: opts.filter((_, i) => i !== oi),
                      })
                    }
                    className="text-xs text-red-600 hover:text-red-700 px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
