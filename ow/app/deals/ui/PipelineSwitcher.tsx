"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import PipelineManager from "./PipelineManager";

interface PipelineSwitcherProps {
  pipelines: Array<{ id: string; name: string; stages?: Array<{ id: string; name: string; orderIndex: number }> }>;
  activePipelineId: string;
}

export default function PipelineSwitcher({ pipelines, activePipelineId }: PipelineSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showManager, setShowManager] = useState(false);
  const [isPending, startTransition] = useTransition();

  function switchPipeline(pipelineId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pipeline", pipelineId);
    const href = `/deals?${params.toString()}`;
    startTransition(() => {
      router.push(href);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 bg-gray-100 rounded-lg p-1 ${isPending ? "opacity-60" : ""}`}>
          {pipelines.map(p => (
            <button
              key={p.id}
              onClick={() => switchPipeline(p.id)}
              disabled={isPending}
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
        <button
          onClick={() => setShowManager(true)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Manage Pipelines"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {showManager && (
        <PipelineManager
          pipelines={pipelines}
          activePipelineId={activePipelineId}
          onClose={() => {
            setShowManager(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
