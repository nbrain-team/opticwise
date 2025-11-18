"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useDroppable, useDraggable } from "@dnd-kit/core";

type Deal = {
  id: string;
  title: string;
  value: string | number;
  currency: string;
  position: number;
  organization?: { name: string | null } | null;
  person?: { firstName: string | null; lastName: string | null } | null;
};

type Stage = {
  id: string;
  name: string;
  orderIndex: number;
};

export default function DealsBoard({
  pipelineId,
  columns,
}: {
  pipelineId: string;
  columns: { stage: Stage; deals: Deal[] }[];
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [optimistic, setOptimistic] = useState(columns);
  const columnsById = useMemo(() => {
    const map = new Map<string, number>();
    optimistic.forEach((c, idx) => map.set(c.stage.id, idx));
    return map;
  }, [optimistic]);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over) return;

    const [fromStageId, dealId] = String(active.id).split(":");
    const [toStageId] = String(over.id).split(":");
    if (!fromStageId || !dealId || !toStageId) return;
    if (fromStageId === toStageId) return;

    // optimistic UI update
    setOptimistic((prev) => {
      const next = prev.map((c) => ({ ...c, deals: [...c.deals] }));
      const fromIdx = columnsById.get(fromStageId)!;
      const toIdx = columnsById.get(toStageId)!;
      const fromCol = next[fromIdx]!;
      const toCol = next[toIdx]!;
      const i = fromCol.deals.findIndex((d) => d.id === dealId);
      if (i === -1) return prev;
      const [moved] = fromCol.deals.splice(i, 1);
      toCol.deals.unshift({ ...moved, position: 0 });
      return next;
    });

    // persist
    await fetch("/api/deals/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealId,
        toStageId,
        pipelineId,
      }),
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {optimistic.map(({ stage, deals }) => (
          <StageColumn key={stage.id} stageId={stage.id} name={stage.name} dealCount={deals.length}>
            {deals.map((deal) => (
              <DealCard key={deal.id} stageId={stage.id} deal={deal} />
            ))}
          </StageColumn>
        ))}
      </div>
      <DragOverlay />
    </DndContext>
  );
}

function StageColumn({
  stageId,
  name,
  dealCount,
  children,
}: {
  stageId: string;
  name: string;
  dealCount: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  return (
    <div 
      ref={setNodeRef} 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-all ${isOver ? "ring-2 ring-[#3B6B8F] bg-blue-50" : ""}`}
    >
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <div className="font-semibold text-[#2E2E2F] text-sm">{name}</div>
        <div className="text-xs text-gray-500 mt-0.5">{dealCount} deals</div>
      </div>
      <div className="p-3 space-y-2 min-h-[200px]">{children}</div>
    </div>
  );
}

function DealCard({ stageId, deal }: { stageId: string; deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${stageId}:${deal.id}`,
  });
  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};
  return (
    <div
      ref={setNodeRef}
      id={`${stageId}:${deal.id}`}
      className={`rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all ${isDragging ? "opacity-50 shadow-lg" : ""}`}
      style={style}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="px-3 py-1.5 border-b border-gray-100 bg-gray-50 rounded-t-lg cursor-grab active:cursor-grabbing flex items-center gap-2 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        <span className="text-xs">Drag to move</span>
      </div>
      
      {/* Clickable Content */}
      <Link href={`/deal/${deal.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
        <div className="font-medium text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors">
          {deal.title}
        </div>
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {deal.organization?.name ?? "No organization"}
        </div>
        {deal.value > 0 && (
          <div className="text-xs font-semibold text-[#3B6B8F] mt-2">
            {deal.currency} {Number(deal.value).toLocaleString()}
          </div>
        )}
      </Link>
    </div>
  );
}


