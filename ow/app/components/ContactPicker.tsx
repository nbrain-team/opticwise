"use client";

import { useState } from "react";
import {
  InlineCreatePicker,
  type PickerOption,
} from "./InlineCreatePicker";

/**
 * Sprint 2 / 3.2 — Contact picker with inline-create modal.
 *
 * Wraps `InlineCreatePicker` with:
 *   - a remote search hook against `GET /api/contacts?search=…`
 *   - a "Create new contact" modal that calls `POST /api/contacts`
 *
 * On successful creation, the new Person is pre-selected in the picker;
 * the parent form does not navigate.
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

async function searchContacts(query: string): Promise<PickerOption[]> {
  const res = await fetch(
    `/api/contacts?search=${encodeURIComponent(query)}&perPage=25`
  );
  if (!res.ok) return [];
  const json = await res.json();
  const list: Array<{
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    email?: string | null;
    organization?: { name?: string | null } | null;
  }> = json.contacts ?? [];
  return list.map((c) => ({
    id: c.id,
    label:
      [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
      c.name ||
      c.email ||
      "(unnamed)",
    sublabel: [c.email, c.organization?.name].filter(Boolean).join(" · ") || null,
  }));
}

function CreateContactModal({
  initialQuery,
  onCreated,
  onCancel,
}: {
  initialQuery: string;
  onCreated: (opt: PickerOption) => void;
  onCancel: () => void;
}) {
  const initialFirst =
    initialQuery.trim().includes(" ")
      ? initialQuery.trim().split(/\s+/)[0]
      : initialQuery.trim();
  const initialLast =
    initialQuery.trim().includes(" ")
      ? initialQuery.trim().split(/\s+/).slice(1).join(" ")
      : "";

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName && !lastName && !email) {
      setError("Provide at least a name or email.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email || undefined,
          organizationName: organizationName || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? `Failed (${res.status})`);
      }
      const fullName =
        [json.firstName, json.lastName].filter(Boolean).join(" ").trim() ||
        json.name ||
        json.email ||
        "(unnamed)";
      onCreated({
        id: json.id,
        label: fullName,
        sublabel:
          [json.email, json.organization?.name].filter(Boolean).join(" · ") ||
          null,
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
        <h3 className="text-lg font-medium text-[#50555C]">New Contact</h3>
        <p className="text-xs text-gray-500">
          Quick-add. Open the contact page later for the full profile.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              First name
            </label>
            <input
              autoFocus
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Organization (optional)
          </label>
          <input
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Company name — created if it doesn't exist"
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

export function ContactPicker({
  fieldName,
  label,
  initialOptions,
  initialValue,
  required,
  allowClear = true,
  onChange,
}: Props) {
  return (
    <InlineCreatePicker
      fieldName={fieldName}
      label={label}
      initialOptions={initialOptions}
      initialValue={initialValue}
      remoteSearch={searchContacts}
      placeholder="Search contacts…"
      createLabel="Create new contact"
      required={required}
      allowClear={allowClear}
      onChange={onChange}
      renderCreateModal={({ initialQuery, onCreated, onCancel }) => (
        <CreateContactModal
          initialQuery={initialQuery}
          onCreated={onCreated}
          onCancel={onCancel}
        />
      )}
    />
  );
}
