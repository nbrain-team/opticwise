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
    <div ref={setNodeRef} className={`bg-gray-50 rounded-lg border ${isOver ? "ring-2 ring-blue-400" : ""}`}>
      <div className="px-3 py-2 border-b bg-white rounded-t-lg">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-gray-500">{dealCount} deals</div>
      </div>
      <div className="p-2 space-y-2">{children}</div>
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
      {...listeners}
      {...attributes}
      id={`${stageId}:${deal.id}`}
      role="button"
      className={`rounded-md border bg-white p-3 shadow-sm ${isDragging ? "opacity-50" : ""}`}
      style={style}
    >
      <Link href={`/deal/${deal.id}`} className="font-medium hover:underline">
        {deal.title}
      </Link>
      <div className="text-xs text-gray-600 mt-1">
        {deal.organization?.name ?? "-"}
      </div>
    </div>
  );
}


