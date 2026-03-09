import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { secret } = await request.json();
  if (secret !== "ow-add-schedule-2026-03-06") {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  const pipeline = await prisma.pipeline.findFirst({
    where: { name: "New Projects Pipeline" },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });

  if (!pipeline) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }

  const existing = pipeline.stages.find(s => s.name === "Schedule Review");
  if (existing) {
    return NextResponse.json({ message: "Stage already exists", stageId: existing.id });
  }

  // Shift all existing stages up by 1
  const shifts = pipeline.stages.map(s =>
    prisma.stage.update({
      where: { id: s.id },
      data: { orderIndex: s.orderIndex + 1 },
    })
  );
  await prisma.$transaction(shifts);

  // Create Schedule Review at position 0
  const stage = await prisma.stage.create({
    data: {
      name: "Schedule Review",
      orderIndex: 0,
      pipelineId: pipeline.id,
    },
  });

  const updated = await prisma.stage.findMany({
    where: { pipelineId: pipeline.id },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({
    success: true,
    stageId: stage.id,
    stages: updated.map(s => ({ name: s.name, orderIndex: s.orderIndex })),
  });
}
