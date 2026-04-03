"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateDealFromContactProps {
  personId: string;
  personName: string;
  organizationId?: string | null;
  organizationName?: string | null;
}

export function CreateDealFromContact({
  personId,
  personName,
  organizationId: _organizationId,
  organizationName,
}: CreateDealFromContactProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string; stages: Array<{ id: string; name: string }> }>>([]);
  const [form, setForm] = useState({
    title: organizationName ? `${organizationName} - ` : `${personName} - `,
    value: "",
    pipelineId: "",
    stageId: "",
  });

  const openModal = async () => {
    setIsOpen(true);
    try {
      const res = await fetch("/api/pipelines");
      const data = await res.json();
      const pips = data.pipelines || [];
      setPipelines(pips);
      if (pips.length > 0) {
        setForm(prev => ({
          ...prev,
          pipelineId: pips[0].id,
          stageId: pips[0].stages[0]?.id || "",
        }));
      }
    } catch {
      setError("Failed to load pipelines");
    }
  };

  const selectedPipeline = pipelines.find(p => p.id === form.pipelineId);

  const handlePipelineChange = (pipelineId: string) => {
    const pip = pipelines.find(p => p.id === pipelineId);
    setForm(prev => ({
      ...prev,
      pipelineId,
      stageId: pip?.stages[0]?.id || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.pipelineId || !form.stageId) return;
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          value: parseFloat(form.value) || 0,
          pipelineId: form.pipelineId,
          stageId: form.stageId,
          organizationName: organizationName || undefined,
          personFirstName: personName.split(" ")[0],
          personLastName: personName.split(" ").slice(1).join(" "),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Also link the person to the deal
        await fetch(`/api/deals/${data.deal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId }),
        });
        setIsOpen(false);
        router.push(`/deal/${data.deal.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create deal");
      }
    } catch {
      setError("Failed to create deal");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="px-4 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-lg hover:bg-[#2d5270] transition-colors"
      >
        + Create Deal
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#2E2E2F]">Create Deal</h2>
                <p className="text-sm text-gray-500">for {personName}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline</label>
                <select
                  value={form.pipelineId}
                  onChange={e => handlePipelineChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={form.stageId}
                  onChange={e => setForm(prev => ({ ...prev, stageId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                >
                  {selectedPipeline?.stages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-lg hover:bg-[#2d5270] disabled:opacity-50 transition-colors"
                >
                  {creating ? "Creating..." : "Create Deal"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
