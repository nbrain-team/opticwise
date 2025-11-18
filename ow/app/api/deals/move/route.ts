import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dealId, toStageId, pipelineId } = await request.json();
  if (!dealId || !toStageId || !pipelineId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Calculate next position at top of target stage
  const maxPos = await prisma.deal.aggregate({
    where: { stageId: toStageId, pipelineId },
    _max: { position: true },
  });
  const nextPos = (maxPos._max.position ?? 0) + 1;

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stageId: toStageId,
      position: nextPos,
      updateTime: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}


