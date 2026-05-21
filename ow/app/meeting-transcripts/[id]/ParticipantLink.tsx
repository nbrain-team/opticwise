"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MatchedPerson = {
  id: string;
  name: string;
  email: string | null;
  orgName: string | null;
};

type Props = {
  meetingId: string;
  participantName: string;
  participantEmail: string | null;
  /** Pre-matched from server-loaded people list (avoids API call). */
  matchedPerson: MatchedPerson | null;
};

export function ParticipantLink({
  meetingId,
  participantName,
  participantEmail,
  matchedPerson: initialMatch,
}: Props) {
  const router = useRouter();
  const [matched, setMatched] = useState<MatchedPerson | null>(initialMatch);
  const [status, setStatus] = useState<"idle" | "linking" | "linked" | "prompt">("idle");
  const [showModal, setShowModal] = useState(false);

  // Modal form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!participantEmail) {
    return <StaticRow name={participantName} />;
  }

  if (matched) {
    return (
      <li className="flex items-center gap-2 text-sm">
        <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="min-w-0">
          <Link
            href={`/person/${matched.id}`}
            className="font-medium text-[#3B6B8F] hover:underline truncate block"
          >
            {matched.name}
          </Link>
          <div className="text-xs text-gray-500 truncate">
            {participantEmail}
            {matched.orgName && <span> &middot; {matched.orgName}</span>}
          </div>
        </div>
      </li>
    );
  }

  async function handleClick() {
    if (status === "linking") return;
    setStatus("linking");
    setError(null);

    try {
      const res = await fetch("/api/contacts/find-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: participantEmail, meetingId }),
      });
      const data = await res.json();

      if (data.found && data.person) {
        setMatched({
          id: data.person.id,
          name:
            [data.person.firstName, data.person.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || data.person.name || participantEmail!,
          email: data.person.email,
          orgName: data.person.organization?.name || null,
        });
        setStatus("linked");
        router.refresh();
      } else {
        // Not found — prompt for details before creating
        const parts = participantName.trim().split(/\s+/);
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setShowModal(true);
        setStatus("prompt");
      }
    } catch {
      setError("Failed to look up contact");
      setStatus("idle");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName && !lastName) {
      setError("Provide at least a first or last name.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/contacts/find-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: participantEmail,
          meetingId,
          create: {
            firstName,
            lastName,
            organizationName: orgName || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`);

      const person = data.person;
      setMatched({
        id: person.id,
        name:
          [person.firstName, person.lastName].filter(Boolean).join(" ").trim() ||
          person.name ||
          participantEmail!,
        email: person.email,
        orgName: person.organization?.name || null,
      });
      setStatus("linked");
      setShowModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const initial = (participantName[0] || "?").toUpperCase();

  return (
    <>
      <li className="flex items-center gap-2 text-sm group">
        <div className="w-7 h-7 rounded-full bg-[#3B6B8F] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
          {status === "linking" ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-800">{participantName}</div>
          <button
            onClick={handleClick}
            disabled={status === "linking"}
            className="text-xs text-[#3B6B8F] hover:underline cursor-pointer disabled:opacity-50"
            title="Click to link as CRM contact"
          >
            {participantEmail}
          </button>
          {error && !showModal && (
            <div className="text-xs text-red-500 mt-0.5">{error}</div>
          )}
        </div>
      </li>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-[#50555C]">
              Add Contact
            </h3>
            <p className="text-xs text-gray-500">
              No contact found for <strong>{participantEmail}</strong>. Create
              one and link to this meeting.
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
                value={participantEmail}
                disabled
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Organization (optional)
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
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
                onClick={() => {
                  setShowModal(false);
                  setStatus("idle");
                }}
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
                {saving ? "Creating\u2026" : "Create & Link"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function StaticRow({ name }: { name: string }) {
  const initial = (name[0] || "?").toUpperCase();
  return (
    <li className="flex items-center gap-2 text-sm">
      <div className="w-7 h-7 rounded-full bg-[#3B6B8F] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
        {initial}
      </div>
      <div>
        <div className="font-medium text-gray-800">{name}</div>
      </div>
    </li>
  );
}
