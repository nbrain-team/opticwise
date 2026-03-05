"use client";

import { useState, useEffect } from "react";

type Stage = {
  id: string;
  name: string;
  orderIndex: number;
};

type Pipeline = {
  id: string;
  name: string;
  stages: Stage[];
  _count: { deals: number };
};

export function PipelineManager() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPipeline, setEditingPipeline] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newPipelineName, setNewPipelineName] = useState("");
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [newStageNames, setNewStageNames] = useState<Record<string, string>>({});
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState("");
  const [newPipelineStages, setNewPipelineStages] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPipelines(); }, []);

  const fetchPipelines = async () => {
    const res = await fetch("/api/pipelines");
    const data = await res.json();
    setPipelines(data.pipelines || []);
    setLoading(false);
  };

  const createPipeline = async () => {
    if (!newPipelineName.trim()) return;
    setSaving(true);
    const stages = newPipelineStages.filter(s => s.trim()).map(s => ({ name: s.trim() }));
    const res = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPipelineName, stages }),
    });
    if (res.ok) {
      setNewPipelineName("");
      setNewPipelineStages([""]);
      setShowNewPipeline(false);
      await fetchPipelines();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to create pipeline");
    }
    setSaving(false);
  };

  const renamePipeline = async (id: string) => {
    if (!editName.trim()) return;
    await fetch(`/api/pipelines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setEditingPipeline(null);
    await fetchPipelines();
  };

  const deletePipeline = async (id: string, dealCount: number) => {
    if (!confirm(`Delete this pipeline and all ${dealCount} deal(s) in it? This cannot be undone.`)) return;
    const res = await fetch(`/api/pipelines/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchPipelines();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete pipeline");
    }
  };

  const addStage = async (pipelineId: string) => {
    const name = newStageNames[pipelineId];
    if (!name?.trim()) return;
    const res = await fetch(`/api/pipelines/${pipelineId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNewStageNames(prev => ({ ...prev, [pipelineId]: "" }));
      await fetchPipelines();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add stage");
    }
  };

  const renameStage = async (pipelineId: string, stageId: string) => {
    if (!editStageName.trim()) return;
    await fetch(`/api/pipelines/${pipelineId}/stages/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editStageName }),
    });
    setEditingStage(null);
    await fetchPipelines();
  };

  const deleteStage = async (pipelineId: string, stageId: string) => {
    if (!confirm("Delete this stage? Stages with deals cannot be deleted.")) return;
    const res = await fetch(`/api/pipelines/${pipelineId}/stages/${stageId}`, { method: "DELETE" });
    if (res.ok) {
      await fetchPipelines();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete stage");
    }
  };

  const moveStage = async (pipelineId: string, stages: Stage[], fromIndex: number, direction: -1 | 1) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= stages.length) return;
    const reordered = [...stages];
    [reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];
    const updated = reordered.map((s, i) => ({ id: s.id, name: s.name, orderIndex: i }));
    await fetch(`/api/pipelines/${pipelineId}/stages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stages: updated }),
    });
    await fetchPipelines();
  };

  if (loading) return <div className="text-sm text-gray-500">Loading pipelines...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Pipeline Manager</h2>
        <button
          onClick={() => setShowNewPipeline(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-lg hover:bg-[#2d5270] transition-colors"
        >
          + New Pipeline
        </button>
      </div>

      {/* Create New Pipeline Form */}
      {showNewPipeline && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-[#2E2E2F]">Create New Pipeline</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Name</label>
            <input
              value={newPipelineName}
              onChange={e => setNewPipelineName(e.target.value)}
              placeholder="e.g. Podcast Guests Pipeline"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stages</label>
            {newPipelineStages.map((stage, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={stage}
                  onChange={e => {
                    const updated = [...newPipelineStages];
                    updated[i] = e.target.value;
                    setNewPipelineStages(updated);
                  }}
                  placeholder={`Stage ${i + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                />
                {newPipelineStages.length > 1 && (
                  <button
                    onClick={() => setNewPipelineStages(prev => prev.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 px-2"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setNewPipelineStages(prev => [...prev, ""])}
              className="text-sm text-[#3B6B8F] hover:underline"
            >
              + Add Stage
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createPipeline}
              disabled={saving || !newPipelineName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#3B6B8F] rounded-lg hover:bg-[#2d5270] disabled:opacity-50 transition-colors"
            >
              {saving ? "Creating..." : "Create Pipeline"}
            </button>
            <button
              onClick={() => { setShowNewPipeline(false); setNewPipelineName(""); setNewPipelineStages([""]); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Pipelines */}
      {pipelines.map(pipeline => (
        <div key={pipeline.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Pipeline Header */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            {editingPipeline === pipeline.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && renamePipeline(pipeline.id)}
                  autoFocus
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F]"
                />
                <button onClick={() => renamePipeline(pipeline.id)} className="text-sm text-[#3B6B8F] font-medium">Save</button>
                <button onClick={() => setEditingPipeline(null)} className="text-sm text-gray-500">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-[#2E2E2F]">{pipeline.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {pipeline._count.deals} deals
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingPipeline(pipeline.id); setEditName(pipeline.name); }}
                className="text-sm text-gray-500 hover:text-[#3B6B8F]"
                title="Rename"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => deletePipeline(pipeline.id, pipeline._count.deals)}
                className="text-sm text-red-500 hover:text-red-700"
                title="Delete pipeline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stages */}
          <div className="p-5 space-y-2">
            {pipeline.stages.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-2 group">
                <div className="flex flex-col">
                  <button
                    onClick={() => moveStage(pipeline.id, pipeline.stages, i, -1)}
                    disabled={i === 0}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveStage(pipeline.id, pipeline.stages, i, 1)}
                    disabled={i === pipeline.stages.length - 1}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <span className="text-xs text-gray-400 w-6 text-right">{i + 1}.</span>
                {editingStage === stage.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={editStageName}
                      onChange={e => setEditStageName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && renameStage(pipeline.id, stage.id)}
                      autoFocus
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button onClick={() => renameStage(pipeline.id, stage.id)} className="text-xs text-[#3B6B8F] font-medium">Save</button>
                    <button onClick={() => setEditingStage(null)} className="text-xs text-gray-500">Cancel</button>
                  </div>
                ) : (
                  <span className="flex-1 text-sm text-gray-800">{stage.name}</span>
                )}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => { setEditingStage(stage.id); setEditStageName(stage.name); }}
                    className="text-gray-400 hover:text-[#3B6B8F] p-1"
                    title="Rename stage"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteStage(pipeline.id, stage.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Delete stage"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Add Stage */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-3">
              <input
                value={newStageNames[pipeline.id] || ""}
                onChange={e => setNewStageNames(prev => ({ ...prev, [pipeline.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addStage(pipeline.id)}
                placeholder="New stage name..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
              />
              <button
                onClick={() => addStage(pipeline.id)}
                disabled={!newStageNames[pipeline.id]?.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#3B6B8F] rounded-lg hover:bg-[#2d5270] disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
