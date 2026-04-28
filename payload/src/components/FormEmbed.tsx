"use client";

import { useEffect, useState } from "react";

// =====================
// FormEmbed
// Client-only renderer that fetches a form definition from the OpticWise
// platform and posts the submission directly back to it (CORS-allowed).
//
// Per /payload/.cursor/rules/payload-deploy-guardrails.mdc: this file must
// not import from any server-only module. It uses only browser APIs.
// =====================

type FieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "number"
  | "url"
  | "date";

type Option = { label: string; value: string };

type Field = {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string | null;
  helpText: string | null;
  options: Option[] | null;
};

type FormDef = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  submitButtonLabel: string;
  successMessage: string;
  honeypotFieldName: string;
  fields: Field[];
};

export type FormEmbedProps = {
  formSlug: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  theme?: "light" | "dark";
  alignment?: "center" | "left";
};

function getPlatformUrl(): string {
  // Set in Vercel env: NEXT_PUBLIC_OPTICWISE_PLATFORM_URL=https://ownet.opticwise.com
  const url =
    (process.env.NEXT_PUBLIC_OPTICWISE_PLATFORM_URL as string | undefined) ||
    "https://ownet.opticwise.com";
  return url.replace(/\/+$/, "");
}

export function FormEmbed({
  formSlug,
  eyebrow,
  heading,
  description,
  theme = "light",
  alignment = "center",
}: FormEmbedProps) {
  const [form, setForm] = useState<FormDef | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch form definition
  useEffect(() => {
    if (!formSlug) {
      setLoadError("This form is missing a formSlug.");
      return;
    }
    const url = `${getPlatformUrl()}/api/public/forms/${encodeURIComponent(formSlug)}`;
    let cancelled = false;
    fetch(url, { method: "GET" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || `Form "${formSlug}" not found.`);
        return data.form as FormDef;
      })
      .then((def) => {
        if (cancelled) return;
        setForm(def);
        // Seed default values
        const seed: Record<string, string | string[]> = {};
        for (const f of def.fields) {
          seed[f.fieldKey] = f.fieldType === "checkbox" ? [] : "";
        }
        seed[def.honeypotFieldName] = "";
        setValues(seed);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load form.");
      });
    return () => {
      cancelled = true;
    };
  }, [formSlug]);

  function setValue(key: string, v: string | string[]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function toggleCheckbox(key: string, optValue: string) {
    setValues((prev) => {
      const current = (prev[key] as string[] | undefined) ?? [];
      const next = current.includes(optValue)
        ? current.filter((x) => x !== optValue)
        : [...current, optValue];
      return { ...prev, [key]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setSubmitError(null);

    // Capture context (referrer, page URL, UTMs) at submit time
    let utm: Record<string, string | undefined> = {};
    try {
      const params = new URLSearchParams(window.location.search);
      utm = {
        utmSource: params.get("utm_source") ?? undefined,
        utmMedium: params.get("utm_medium") ?? undefined,
        utmCampaign: params.get("utm_campaign") ?? undefined,
        utmTerm: params.get("utm_term") ?? undefined,
        utmContent: params.get("utm_content") ?? undefined,
      };
    } catch {
      utm = {};
    }

    const meta = {
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
      ...utm,
    };

    const url = `${getPlatformUrl()}/api/public/forms/${encodeURIComponent(form.slug)}/submit`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, _meta: meta }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Submission failed. Please try again.");
      }
      setSuccessMessage(data?.message || form.successMessage || "Thanks!");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // ===== Styling =====
  const isDark = theme === "dark";
  const isCentered = alignment === "center";

  const sectionBg = isDark ? "bg-ow-navy" : "bg-white";
  const headingColor = isDark ? "text-white" : "text-gray-900";
  const subTextColor = isDark ? "text-white/70" : "text-gray-600";
  const eyebrowColor = isDark ? "text-blue-300" : "text-ow-blue";
  const cardBg = isDark ? "bg-white/5 backdrop-blur border border-white/10" : "bg-white border border-gray-200 shadow-sm";
  const labelColor = isDark ? "text-white/80" : "text-gray-700";
  const inputBase = isDark
    ? "w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
    : "w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:border-ow-blue focus:ring-1 focus:ring-ow-blue";

  return (
    <section className={`ow-section ${sectionBg}`}>
      <div className="ow-container">
        <div className={`max-w-2xl ${isCentered ? "mx-auto text-center" : ""}`}>
          {(eyebrow || heading || form?.name || description || form?.description) && (
            <div className={`mb-8 ${isCentered ? "text-center" : ""}`}>
              {eyebrow && (
                <span className={`text-xs font-bold uppercase tracking-widest ${eyebrowColor} mb-3 block`}>
                  {eyebrow}
                </span>
              )}
              <h2 className={`text-3xl lg:text-4xl font-extrabold ${headingColor} leading-tight mb-3`}>
                {heading || form?.name || "Get in touch"}
              </h2>
              {(description || form?.description) && (
                <p className={`text-base lg:text-lg ${subTextColor}`}>{description || form?.description}</p>
              )}
            </div>
          )}

          <div className={`rounded-xl p-6 lg:p-8 ${cardBg}`}>
            {loadError && (
              <div className={`text-sm ${isDark ? "text-red-300" : "text-red-700"} text-left`}>
                {loadError}
              </div>
            )}

            {!form && !loadError && (
              <div className={`text-sm ${subTextColor} text-left`}>Loading form…</div>
            )}

            {form && successMessage && (
              <div
                className={`p-5 rounded-lg text-left ${
                  isDark
                    ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-200"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                }`}
              >
                <p className="text-base font-medium">{successMessage}</p>
              </div>
            )}

            {form && !successMessage && (
              <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
                {form.fields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={values[field.fieldKey]}
                    onChange={(v) => setValue(field.fieldKey, v)}
                    onToggleCheckbox={(optValue) => toggleCheckbox(field.fieldKey, optValue)}
                    inputClass={inputBase}
                    labelColor={labelColor}
                    helpColor={subTextColor}
                  />
                ))}

                {/* Honeypot — visually hidden but available to bots */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden",
                  }}
                >
                  <label htmlFor={`hp-${form.honeypotFieldName}`}>Leave this field blank</label>
                  <input
                    type="text"
                    id={`hp-${form.honeypotFieldName}`}
                    name={form.honeypotFieldName}
                    tabIndex={-1}
                    autoComplete="off"
                    value={(values[form.honeypotFieldName] as string) || ""}
                    onChange={(e) => setValue(form.honeypotFieldName, e.target.value)}
                  />
                </div>

                {submitError && (
                  <div
                    className={`text-sm rounded-lg p-3 ${
                      isDark
                        ? "bg-red-500/10 border border-red-400/30 text-red-200"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                    isDark
                      ? "bg-white text-ow-navy hover:bg-white/90"
                      : "bg-ow-blue text-white hover:bg-ow-blue-dark"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {submitting ? "Sending…" : form.submitButtonLabel || "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  onToggleCheckbox,
  inputClass,
  labelColor,
  helpColor,
}: {
  field: Field;
  value: string | string[] | undefined;
  onChange: (v: string) => void;
  onToggleCheckbox: (optValue: string) => void;
  inputClass: string;
  labelColor: string;
  helpColor: string;
}) {
  const labelEl = (
    <label className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
  const helpEl = field.helpText ? (
    <p className={`text-xs mt-1 ${helpColor}`}>{field.helpText}</p>
  ) : null;

  const v = (value ?? (field.fieldType === "checkbox" ? [] : "")) as string | string[];

  switch (field.fieldType) {
    case "textarea":
      return (
        <div>
          {labelEl}
          <textarea
            required={field.required}
            placeholder={field.placeholder ?? ""}
            value={typeof v === "string" ? v : ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={inputClass}
          />
          {helpEl}
        </div>
      );

    case "select":
      return (
        <div>
          {labelEl}
          <select
            required={field.required}
            value={typeof v === "string" ? v : ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">{field.placeholder || "Select…"}</option>
            {(field.options || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {helpEl}
        </div>
      );

    case "radio":
      return (
        <div>
          {labelEl}
          <div className="space-y-2">
            {(field.options || []).map((o) => (
              <label key={o.value} className={`flex items-center gap-2 text-sm ${labelColor}`}>
                <input
                  type="radio"
                  name={field.fieldKey}
                  value={o.value}
                  checked={v === o.value}
                  onChange={(e) => onChange(e.target.value)}
                  required={field.required}
                  className="h-4 w-4"
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
          {helpEl}
        </div>
      );

    case "checkbox":
      return (
        <div>
          {labelEl}
          <div className="space-y-2">
            {(field.options || []).map((o) => {
              const arr = Array.isArray(v) ? v : [];
              const checked = arr.includes(o.value);
              return (
                <label key={o.value} className={`flex items-center gap-2 text-sm ${labelColor}`}>
                  <input
                    type="checkbox"
                    value={o.value}
                    checked={checked}
                    onChange={() => onToggleCheckbox(o.value)}
                    className="h-4 w-4"
                  />
                  <span>{o.label}</span>
                </label>
              );
            })}
          </div>
          {helpEl}
        </div>
      );

    default: {
      const inputType =
        field.fieldType === "email"
          ? "email"
          : field.fieldType === "tel"
            ? "tel"
            : field.fieldType === "number"
              ? "number"
              : field.fieldType === "url"
                ? "url"
                : field.fieldType === "date"
                  ? "date"
                  : "text";
      return (
        <div>
          {labelEl}
          <input
            type={inputType}
            required={field.required}
            placeholder={field.placeholder ?? ""}
            value={typeof v === "string" ? v : ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {helpEl}
        </div>
      );
    }
  }
}
