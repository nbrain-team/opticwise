"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  emailWork?: string | null;
  title?: string | null;
  phoneMobile?: string | null;
  phoneWork?: string | null;
  organization?: { id: string; name: string } | null;
}

interface DealContactEntry {
  id: string;
  dealId: string;
  personId: string;
  role: string | null;
  isPrimary: boolean;
  notes: string | null;
  person: Person;
}

interface DealContactsProps {
  dealId: string;
  dealContacts: DealContactEntry[];
  allPeople: Array<{ id: string; firstName: string; lastName: string }>;
}

const ROLE_LABELS: Record<string, string> = {
  champion: "Champion",
  decision_maker: "Decision Maker",
  technical_evaluator: "Technical Evaluator",
  influencer: "Influencer",
  end_user: "End User",
  other: "Other",
};

const ROLE_COLORS: Record<string, string> = {
  champion: "bg-purple-100 text-purple-700",
  decision_maker: "bg-blue-100 text-blue-700",
  technical_evaluator: "bg-teal-100 text-teal-700",
  influencer: "bg-amber-100 text-amber-700",
  end_user: "bg-gray-100 text-gray-700",
  other: "bg-gray-100 text-gray-600",
};

export function DealContacts({ dealId, dealContacts, allPeople }: DealContactsProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const existingPersonIds = new Set(dealContacts.map(dc => dc.personId));
  const availablePeople = allPeople.filter(p => !existingPersonIds.has(p.id));
  const filteredPeople = searchTerm
    ? availablePeople.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availablePeople;

  const handleAdd = useCallback(async () => {
    if (!selectedPersonId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: selectedPersonId,
          role: selectedRole || null,
          isPrimary,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add contact");
      }
      setShowAddForm(false);
      setSelectedPersonId("");
      setSelectedRole("");
      setIsPrimary(false);
      setSearchTerm("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error adding contact");
    } finally {
      setSaving(false);
    }
  }, [dealId, selectedPersonId, selectedRole, isPrimary, router]);

  const handleRemove = useCallback(async (personId: string) => {
    if (!confirm("Remove this contact from the deal?")) return;
    try {
      const res = await fetch(`/api/deals/${dealId}/contacts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove contact");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error removing contact");
    }
  }, [dealId, router]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#2E2E2F]">
          Stakeholders ({dealContacts.length})
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-medium text-[#3B6B8F] hover:text-[#2d5270] transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Search Contact</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Contact</label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
            >
              <option value="">Select a contact...</option>
              {filteredPeople.slice(0, 50).map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6B8F]"
            >
              <option value="">No specific role</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isPrimary" className="text-sm text-gray-700">Primary contact</label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!selectedPersonId || saving}
              className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B6B8F] rounded-md hover:bg-[#2d5270] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Adding..." : "Add Contact"}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setSearchTerm(""); }}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts List */}
      {dealContacts.length > 0 ? (
        <div className="space-y-2">
          {dealContacts.map((dc) => (
            <div
              key={dc.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/person/${dc.person.id}`}
                    className="font-medium text-[#3B6B8F] hover:underline text-sm"
                  >
                    {dc.person.firstName} {dc.person.lastName}
                  </Link>
                  {dc.isPrimary && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#3B6B8F] text-white">
                      PRIMARY
                    </span>
                  )}
                  {dc.role && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[dc.role] || ROLE_COLORS.other}`}>
                      {ROLE_LABELS[dc.role] || dc.role}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {dc.person.title && <span>{dc.person.title}</span>}
                  {dc.person.title && dc.person.email && <span> &middot; </span>}
                  {dc.person.email && <span>{dc.person.email}</span>}
                </div>
              </div>
              <button
                onClick={() => handleRemove(dc.personId)}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from deal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400 py-2">No stakeholders added yet</div>
      )}
    </div>
  );
}
