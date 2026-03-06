"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PipelineSwitcherProps {
  pipelines: Array<{ id: string; name: string }>;
  activePipelineId: string;
}

export default function PipelineSwitcher({ pipelines, activePipelineId }: PipelineSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (pipelines.length <= 1) return null;

  const switchPipeline = (pipelineId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pipeline", pipelineId);
    router.push(`/deals?${params.toString()}`);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {pipelines.map(p => (
        <button
          key={p.id}
          onClick={() => switchPipeline(p.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activePipelineId === p.id
              ? "bg-white text-[#3B6B8F] shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
