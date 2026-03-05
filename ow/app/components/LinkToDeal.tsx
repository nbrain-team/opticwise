"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkToDealProps {
  personId?: string;
  organizationId?: string;
}

export function LinkToDeal({ personId, organizationId }: LinkToDealProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; title: string; organization?: { name: string } | null }>>([]);
  const [linking, setLinking] = useState(false);

  const searchDeals = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await fetch(`/api/deals/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.deals || []);
      }
    } catch { /* ignore */ }
  };

  const linkDeal = async (dealId: string) => {
    setLinking(true);
    try {
      const update: Record<string, unknown> = {};
      if (personId) update.personId = personId;
      if (organizationId) update.organizationId = organizationId;

      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        setOpen(false);
        setQuery("");
        setResults([]);
        router.refresh();
      } else {
        alert("Failed to link deal");
      }
    } catch {
      alert("Failed to link deal");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-[#3B6B8F] hover:text-[#2d5270] font-medium"
      >
        + Link to Deal
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg border border-gray-200 shadow-xl z-50">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search deals..."
              value={query}
              onChange={(e) => searchDeals(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {query ? "No deals found" : "Type to search"}
              </div>
            ) : (
              results.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => linkDeal(deal.id)}
                  disabled={linking}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50"
                >
                  <div className="text-sm font-medium text-gray-900">{deal.title}</div>
                  {deal.organization?.name && (
                    <div className="text-xs text-gray-500">{deal.organization.name}</div>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
