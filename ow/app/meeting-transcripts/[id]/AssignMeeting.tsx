"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MeetingData = {
  id: string;
  title: string;
  dealId: string | null;
  personId: string | null;
  organizationId: string | null;
  deal: { id: string; title: string } | null;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  organization: { id: string; name: string } | null;
};

type DealOption = { id: string; title: string; orgName: string | null };
type PersonOption = {
  id: string;
  name: string;
  email: string | null;
  orgId: string | null;
  orgName: string | null;
};

export function AssignMeeting({
  meeting,
  deals,
  people,
}: {
  meeting: MeetingData;
  deals: DealOption[];
  people: PersonOption[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "deal" | "contact">("view");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  async function assignDeal(dealId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/meeting-transcripts/${meeting.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      router.refresh();
      setMode("view");
      setSearch("");
    } finally {
      setSaving(false);
    }
  }

  async function assignContact(personId: string) {
    setSaving(true);
    try {
      const person = people.find((p) => p.id === personId);
      const res = await fetch(`/api/meeting-transcripts/${meeting.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          organizationId: person?.orgId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      router.refresh();
      setMode("view");
      setSearch("");
    } finally {
      setSaving(false);
    }
  }

  async function unassign() {
    setSaving(true);
    try {
      const res = await fetch(`/api/meeting-transcripts/${meeting.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: null,
          personId: null,
          organizationId: null,
        }),
      });
      if (!res.ok) throw new Error("Failed to unassign");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const q = search.toLowerCase();
  const filteredDeals = search
    ? deals.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.orgName?.toLowerCase().includes(q)
      )
    : deals.slice(0, 20);

  const filteredPeople = search
    ? people.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.orgName?.toLowerCase().includes(q)
      )
    : people.slice(0, 20);

  const isLinked = meeting.dealId || meeting.personId || meeting.organizationId;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
        CRM Assignment
      </h2>

      {isLinked && mode === "view" && (
        <div className="space-y-3 mb-4">
          {meeting.deal && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Deal
              </div>
              <Link
                href={`/deal/${meeting.deal.id}`}
                className="text-sm font-medium text-[#3B6B8F] hover:underline"
              >
                {meeting.deal.title}
              </Link>
            </div>
          )}
          {meeting.person && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Contact
              </div>
              <Link
                href={`/contact/${meeting.person.id}`}
                className="text-sm font-medium text-[#3B6B8F] hover:underline"
              >
                {meeting.person.firstName} {meeting.person.lastName}
              </Link>
            </div>
          )}
          {meeting.organization && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Organization
              </div>
              <Link
                href={`/organization/${meeting.organization.id}`}
                className="text-sm font-medium text-[#3B6B8F] hover:underline"
              >
                {meeting.organization.name}
              </Link>
            </div>
          )}
          <button
            onClick={unassign}
            disabled={saving}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            {saving ? "Removing..." : "Remove assignment"}
          </button>
        </div>
      )}

      {mode === "view" && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setMode("deal")}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {meeting.dealId ? "Change Deal" : "Link to Deal"}
          </button>
          <button
            onClick={() => setMode("contact")}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {meeting.personId ? "Change Contact" : "Link to Contact"}
          </button>
        </div>
      )}

      {mode === "deal" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredDeals.map((deal) => (
              <button
                key={deal.id}
                onClick={() => assignDeal(deal.id)}
                disabled={saving}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-800 truncate">
                  {deal.title}
                </div>
                {deal.orgName && (
                  <div className="text-xs text-gray-500">{deal.orgName}</div>
                )}
              </button>
            ))}
            {filteredDeals.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">
                No deals found
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setMode("view");
              setSearch("");
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {mode === "contact" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredPeople.map((p) => (
              <button
                key={p.id}
                onClick={() => assignContact(p.id)}
                disabled={saving}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500">
                  {p.email || "No email"}
                  {p.orgName && ` - ${p.orgName}`}
                </div>
              </button>
            ))}
            {filteredPeople.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">
                No contacts found
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setMode("view");
              setSearch("");
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
