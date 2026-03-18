"use client";

import { useState } from "react";

interface Stage {
  id: string;
  name: string;
  orderIndex: number;
}

interface Pipeline {
  id: string;
  name: string;
  stages?: Stage[];
}

interface PipelineManagerProps {
  pipelines: Pipeline[];
  activePipelineId: string;
  onClose: () => void;
}

export default function PipelineManager({ pipelines: initialPipelines, onClose }: PipelineManagerProps) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0]?.id || "");
  const [editingPipelineName, setEditingPipelineName] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState("");
  const [newPipelineName, setNewPipelineName] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [newPipelineStages, setNewPipelineStages] = useState<string[]>(["Stage 1"]);

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  const handleRenamePipeline = async (pipelineId: string, name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pipelines/${pipelineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rename pipeline");
      }
      const data = await res.json();
      setPipelines(prev => prev.map(p => p.id === pipelineId ? { ...p, name: data.pipeline.name } : p));
      setEditingPipelineName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename pipeline");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) return;
    const validStages = newPipelineStages.filter(s => s.trim());
    if (validStages.length === 0) {
      setError("At least one stage is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPipelineName.trim(),
          stages: validStages.map(name => ({ name: name.trim() })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create pipeline");
      }
      const data = await res.json();
      setPipelines(prev => [...prev, data.pipeline]);
      setSelectedPipelineId(data.pipeline.id);
      setNewPipelineName("");
      setNewPipelineStages(["Stage 1"]);
      setShowNewPipeline(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pipeline");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    if (pipelines.length <= 1) {
      setError("Cannot delete the last pipeline");
      return;
    }
    if (!confirm("Delete this pipeline? All deals in it will be permanently deleted.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pipelines/${pipelineId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete pipeline");
      }
      setPipelines(prev => prev.filter(p => p.id !== pipelineId));
      if (selectedPipelineId === pipelineId) {
        const remaining = pipelines.filter(p => p.id !== pipelineId);
        setSelectedPipelineId(remaining[0]?.id || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pipeline");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim() || !selectedPipelineId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pipelines/${selectedPipelineId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStageName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add stage");
      }
      const data = await res.json();
      setPipelines(prev => prev.map(p =>
        p.id === selectedPipelineId
          ? { ...p, stages: [...(p.stages || []), data.stage] }
          : p
      ));
      setNewStageName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stage");
    } finally {
      setLoading(false);
    }
  };

  const handleRenameStage = async (stageId: string, name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pipelines/${selectedPipelineId}/stages/${stageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rename stage");
      }
      const data = await res.json();
      setPipelines(prev => prev.map(p =>
        p.id === selectedPipelineId
          ? { ...p, stages: (p.stages || []).map(s => s.id === stageId ? data.stage : s) }
          : p
      ));
      setEditingStageId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename stage");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm("Delete this stage? Stages with deals cannot be deleted.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pipelines/${selectedPipelineId}/stages/${stageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete stage");
      }
      setPipelines(prev => prev.map(p =>
        p.id === selectedPipelineId
          ? { ...p, stages: (p.stages || []).filter(s => s.id !== stageId) }
          : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete stage");
    } finally {
      setLoading(false);
    }
  };

  const handleReorderStages = async (stageId: string, direction: "up" | "down") => {
    const stages = [...(selectedPipeline?.stages || [])].sort((a, b) => a.orderIndex - b.orderIndex);
    const idx = stages.findIndex(s => s.id === stageId);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === stages.length - 1)) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [stages[idx], stages[swapIdx]] = [stages[swapIdx], stages[idx]];
    const reordered = stages.map((s, i) => ({ ...s, orderIndex: i }));

    setPipelines(prev => prev.map(p =>
      p.id === selectedPipelineId ? { ...p, stages: reordered } : p
    ));

    try {
      await fetch(`/api/pipelines/${selectedPipelineId}/stages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stages: reordered.map(s => ({ id: s.id, name: s.name, orderIndex: s.orderIndex })) }),
      });
    } catch {
      setError("Failed to reorder stages");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#2E2E2F]">Manage Pipelines</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
            <button onClick={() => setError("")} className="ml-2 text-red-500 hover:text-red-700 font-medium">Dismiss</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Pipeline Tabs */}
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {pipelines.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPipelineId(p.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    selectedPipelineId === p.id
                      ? "bg-[#3B6B8F] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => setShowNewPipeline(true)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#3B6B8F] hover:text-[#3B6B8F] transition-colors"
              >
                + New Pipeline
              </button>
            </div>
          </div>

          {/* New Pipeline Form */}
          {showNewPipeline && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-[#2E2E2F]">Create New Pipeline</h3>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Pipeline Name</label>
                <input
                  type="text"
                  value={newPipelineName}
                  onChange={e => setNewPipelineName(e.target.value)}
                  placeholder="e.g. MTU Tenant Pipeline"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Stages</label>
                <div className="space-y-2">
                  {newPipelineStages.map((stage, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                      <input
                        type="text"
                        value={stage}
                        onChange={e => {
                          const updated = [...newPipelineStages];
                          updated[i] = e.target.value;
                          setNewPipelineStages(updated);
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                      />
                      {newPipelineStages.length > 1 && (
                        <button
                          onClick={() => setNewPipelineStages(prev => prev.filter((_, j) => j !== i))}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setNewPipelineStages(prev => [...prev, `Stage ${prev.length + 1}`])}
                    className="text-xs text-[#3B6B8F] hover:underline"
                  >
                    + Add another stage
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleCreatePipeline}
                  disabled={loading || !newPipelineName.trim()}
                  className="px-4 py-2 bg-[#3B6B8F] text-white text-sm font-medium rounded-lg hover:bg-[#2d5470] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Creating..." : "Create Pipeline"}
                </button>
                <button
                  onClick={() => { setShowNewPipeline(false); setNewPipelineName(""); setNewPipelineStages(["Stage 1"]); }}
                  className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Selected Pipeline Details */}
          {selectedPipeline && (
            <div className="space-y-4">
              {/* Pipeline Name */}
              <div className="flex items-center gap-3">
                {editingPipelineName === selectedPipeline.id ? (
                  <form
                    onSubmit={e => { e.preventDefault(); handleRenamePipeline(selectedPipeline.id, editingPipelineName === selectedPipeline.id ? (document.getElementById("pipeline-name-input") as HTMLInputElement)?.value || "" : ""); }}
                    className="flex items-center gap-2 flex-1"
                  >
                    <input
                      id="pipeline-name-input"
                      type="text"
                      defaultValue={selectedPipeline.name}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === "Escape") setEditingPipelineName(null);
                      }}
                    />
                    <button type="submit" disabled={loading} className="px-3 py-1.5 bg-[#3B6B8F] text-white text-xs font-medium rounded-md hover:bg-[#2d5470] disabled:opacity-50">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingPipelineName(null)} className="px-3 py-1.5 text-gray-600 text-xs font-medium hover:bg-gray-100 rounded-md">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-[#2E2E2F] flex-1">{selectedPipeline.name}</h3>
                    <button
                      onClick={() => setEditingPipelineName(selectedPipeline.id)}
                      className="p-1.5 text-gray-400 hover:text-[#3B6B8F] hover:bg-gray-100 rounded-md transition-colors"
                      title="Rename pipeline"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {pipelines.length > 1 && (
                      <button
                        onClick={() => handleDeletePipeline(selectedPipeline.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete pipeline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Stages List */}
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Stages</h4>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {(selectedPipeline.stages || [])
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((stage, idx) => (
                      <div key={stage.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 group">
                        <span className="text-xs text-gray-400 w-5 flex-shrink-0">{idx + 1}.</span>
                        {editingStageId === stage.id ? (
                          <form
                            onSubmit={e => { e.preventDefault(); handleRenameStage(stage.id, editingStageName); }}
                            className="flex items-center gap-2 flex-1"
                          >
                            <input
                              type="text"
                              value={editingStageName}
                              onChange={e => setEditingStageName(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === "Escape") setEditingStageId(null);
                              }}
                            />
                            <button type="submit" disabled={loading} className="px-2 py-1 bg-[#3B6B8F] text-white text-xs rounded hover:bg-[#2d5470] disabled:opacity-50">
                              Save
                            </button>
                            <button type="button" onClick={() => setEditingStageId(null)} className="px-2 py-1 text-gray-500 text-xs hover:bg-gray-100 rounded">
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className="text-sm text-[#2E2E2F] flex-1">{stage.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleReorderStages(stage.id, "up")}
                                disabled={idx === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                title="Move up"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReorderStages(stage.id, "down")}
                                disabled={idx === (selectedPipeline.stages || []).length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                title="Move down"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => { setEditingStageId(stage.id); setEditingStageName(stage.name); }}
                                className="p-1 text-gray-400 hover:text-[#3B6B8F]"
                                title="Rename stage"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteStage(stage.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                                title="Delete stage"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                  {/* Add Stage Row */}
                  <div className="px-4 py-2.5">
                    <form
                      onSubmit={e => { e.preventDefault(); handleAddStage(); }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-xs text-gray-400 w-5 flex-shrink-0">+</span>
                      <input
                        type="text"
                        value={newStageName}
                        onChange={e => setNewStageName(e.target.value)}
                        placeholder="Add new stage..."
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={loading || !newStageName.trim()}
                        className="px-3 py-1 bg-[#3B6B8F] text-white text-xs font-medium rounded hover:bg-[#2d5470] disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#3B6B8F] text-white text-sm font-medium rounded-lg hover:bg-[#2d5470] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
