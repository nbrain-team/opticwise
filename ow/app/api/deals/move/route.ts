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

  // Get current deal to check if stage is changing
  const currentDeal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { stageId: true },
  });

  const updateData: any = {
    stageId: toStageId,
    position: nextPos,
    updateTime: new Date(),
  };

  // If stage is actually changing, update stageChangeTime
  if (currentDeal && currentDeal.stageId !== toStageId) {
    updateData.stageChangeTime = new Date();
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}


