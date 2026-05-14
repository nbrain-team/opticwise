"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Sprint 2 / 3.6 (ii) Phase 2 — interactive merge UI for one duplicate group.
 *
 * Each row in the group shows a "Merge others into this" button. Clicking
 * opens an inline confirmation banner that:
 *   - lists every victim that will be merged in,
 *   - tallies the linked emails / deals across victims that will move to the
 *     keeper,
 *   - requires an explicit Confirm click.
 * On confirm we POST to /api/contacts/merge, then router.refresh() so the
 * server-side group list re-fetches and the just-merged group falls out.
 */

export type DuplicatePersonSerialized = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  emailWork: string | null;
  organizationName: string | null;
  createdAtISO: string;
  emailsLinked: number;
  dealsLinked: number;
};

export type DuplicateGroupSerialized = {
  normalizedKey: string;
  displayName: string;
  people: DuplicatePersonSerialized[];
};

export function DuplicateGroupCard({ group }: { group: DuplicateGroupSerialized }) {
  const router = useRouter();
  const [pendingKeeperId, setPendingKeeperId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merged, setMerged] = useState(false);
  const [, startTransition] = useTransition();

  const totalEmails = group.people.reduce((sum, p) => sum + p.emailsLinked, 0);
  const totalDeals = group.people.reduce((sum, p) => sum + p.dealsLinked, 0);

  const startMergeFlow = (keeperId: string) => {
    setError(null);
    setPendingKeeperId(keeperId);
  };

  const cancelMerge = () => {
    setPendingKeeperId(null);
    setError(null);
  };

  const confirmMerge = async () => {
    if (!pendingKeeperId) return;
    const victimIds = group.people
      .filter((p) => p.id !== pendingKeeperId)
      .map((p) => p.id);

    setMerging(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepId: pendingKeeperId, victimIds }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error ?? `Merge failed (${res.status})`);
      }
      setMerged(true);
      setPendingKeeperId(null);
      // Re-fetch the group list from the server so this group disappears.
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setMerging(false);
    }
  };

  if (merged) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <strong>{group.displayName}</strong> merged successfully. Refreshing list…
      </section>
    );
  }

  const pendingKeeper = group.people.find((p) => p.id === pendingKeeperId) ?? null;
  const pendingVictims = pendingKeeper
    ? group.people.filter((p) => p.id !== pendingKeeper.id)
    : [];
  const victimEmails = pendingVictims.reduce((sum, p) => sum + p.emailsLinked, 0);
  const victimDeals = pendingVictims.reduce((sum, p) => sum + p.dealsLinked, 0);

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-medium text-[#50555C]">{group.displayName}</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {group.people.length} records
          </span>
          {totalEmails > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              {totalEmails} email{totalEmails === 1 ? "" : "s"} across the group
            </span>
          )}
          {totalDeals > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              {totalDeals} deal{totalDeals === 1 ? "" : "s"} across the group
            </span>
          )}
        </div>
      </header>

      {pendingKeeper && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-medium">
            Merge {pendingVictims.length} other record{pendingVictims.length === 1 ? "" : "s"} into{" "}
            <span className="font-mono">{pendingKeeper.email ?? pendingKeeper.id}</span>?
          </div>
          <ul className="mt-1 ml-5 list-disc text-xs text-amber-800">
            {pendingVictims.map((v) => (
              <li key={v.id}>
                <span className="font-mono">{v.email ?? v.id}</span>
                {v.organizationName ? ` (${v.organizationName})` : ""}
                {v.emailsLinked > 0 ? ` — ${v.emailsLinked} email${v.emailsLinked === 1 ? "" : "s"}` : ""}
                {v.dealsLinked > 0 ? `, ${v.dealsLinked} deal${v.dealsLinked === 1 ? "" : "s"}` : ""}
              </li>
            ))}
          </ul>
          <div className="mt-2 text-xs text-amber-800">
            All linked rows will move to the keeper:{" "}
            <strong>{victimEmails}</strong> email{victimEmails === 1 ? "" : "s"},{" "}
            <strong>{victimDeals}</strong> deal{victimDeals === 1 ? "" : "s"}, plus any
            activities, notes, calendar events, and form submissions. The victim contact
            row{pendingVictims.length === 1 ? "" : "s"} will then be deleted. Backfilled
            fields on the keeper are non-destructive (only fills nulls).
          </div>
          {error && (
            <div className="mt-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-800">
              {error}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirmMerge}
              disabled={merging}
              className="rounded bg-amber-700 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {merging ? "Merging…" : "Confirm merge"}
            </button>
            <button
              type="button"
              onClick={cancelMerge}
              disabled={merging}
              className="rounded border border-amber-300 bg-white px-3 py-1 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Open</th>
              <th className="px-4 py-2 font-medium">Primary email</th>
              <th className="px-4 py-2 font-medium">Work email</th>
              <th className="px-4 py-2 font-medium">Organization</th>
              <th className="px-4 py-2 font-medium text-right">Emails</th>
              <th className="px-4 py-2 font-medium text-right">Deals</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2 font-medium">Merge</th>
            </tr>
          </thead>
          <tbody>
            {group.people.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link
                    href={`/person/${p.id}`}
                    className="text-[#3B6B8F] hover:underline"
                  >
                    View →
                  </Link>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-700">
                  {p.email ?? <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-700">
                  {p.emailWork ?? <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {p.organizationName ?? <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                  {p.emailsLinked.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                  {p.dealsLinked.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(p.createdAtISO).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => startMergeFlow(p.id)}
                    disabled={Boolean(pendingKeeperId) || merging}
                    className="rounded border border-[#3B6B8F] bg-white px-2 py-1 text-xs text-[#3B6B8F] hover:bg-[#3B6B8F] hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#3B6B8F]"
                  >
                    Merge others → this
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
