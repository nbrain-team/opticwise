"use client";

import { useState } from "react";
import {
  InlineCreatePicker,
  type PickerOption,
} from "./InlineCreatePicker";

/**
 * Sprint 2 / 3.2 — Organization picker with inline-create modal.
 *
 * Wraps `InlineCreatePicker` with:
 *   - a remote search hook against `GET /api/organizations?search=…`
 *   - a "Create new organization" modal that calls `POST /api/organizations`
 *
 * Used in the deal-create form and anywhere else a long-list org picker
 * exists today.
 */

type Props = {
  fieldName: string;
  label: string;
  initialOptions: PickerOption[];
  initialValue?: PickerOption | null;
  required?: boolean;
  allowClear?: boolean;
  onChange?: (id: string | null) => void;
};

async function searchOrganizations(query: string): Promise<PickerOption[]> {
  const res = await fetch(
    `/api/organizations?search=${encodeURIComponent(query)}&perPage=25`
  );
  if (!res.ok) return [];
  const json = await res.json();
  const list: Array<{
    id: string;
    name: string;
    domain?: string | null;
    industry?: string | null;
  }> = json.organizations ?? [];
  return list.map((o) => ({
    id: o.id,
    label: o.name,
    sublabel: [o.domain, o.industry].filter(Boolean).join(" · ") || null,
  }));
}

function CreateOrganizationModal({
  initialQuery,
  onCreated,
  onCancel,
}: {
  initialQuery: string;
  onCreated: (opt: PickerOption) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialQuery.trim());
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Organization name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim() || undefined,
          industry: industry.trim() || undefined,
        }),
      });
      const json = await res.json();

      if (res.status === 409 && json.existing) {
        // Already exists — surface it as if we created it.
        onCreated({
          id: json.existing.id,
          label: json.existing.name,
          sublabel:
            [json.existing.domain, json.existing.industry]
              .filter(Boolean)
              .join(" · ") || null,
        });
        return;
      }

      if (!res.ok) {
        throw new Error(json.error ?? `Failed (${res.status})`);
      }

      onCreated({
        id: json.id,
        label: json.name,
        sublabel: [json.domain, json.industry].filter(Boolean).join(" · ") || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-[#50555C]">New Organization</h3>
        <p className="text-xs text-gray-500">
          Quick-add. Open the organization page later for the full profile.
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Domain (optional)
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="acme.com"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Industry (optional)
          </label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Multifamily, Office, Industrial, …"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
          />
        </div>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-[#3B6B8F] text-white rounded hover:bg-[#2d5270] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function OrganizationPicker({
  fieldName,
  label,
  initialOptions,
  initialValue,
  required,
  allowClear = true,
}: Props) {
  return (
    <InlineCreatePicker
      fieldName={fieldName}
      label={label}
      initialOptions={initialOptions}
      initialValue={initialValue}
      remoteSearch={searchOrganizations}
      placeholder="Search organizations…"
      createLabel="Create new organization"
      required={required}
      allowClear={allowClear}
      renderCreateModal={({ initialQuery, onCreated, onCancel }) => (
        <CreateOrganizationModal
          initialQuery={initialQuery}
          onCreated={onCreated}
          onCancel={onCancel}
        />
      )}
    />
  );
}
