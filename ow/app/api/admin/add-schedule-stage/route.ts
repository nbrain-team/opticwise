import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { secret } = await request.json();
  if (secret !== "ow-add-schedule-2026-03-06") {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  try {
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

    // Move all existing stages to temp high indices to avoid unique constraint
    const tempShifts = pipeline.stages.map((s, i) =>
      prisma.stage.update({
        where: { id: s.id },
        data: { orderIndex: 1000 + i },
      })
    );
    await prisma.$transaction(tempShifts);

    // Create Schedule Review at position 0
    const stage = await prisma.stage.create({
      data: {
        name: "Schedule Review",
        orderIndex: 0,
        pipelineId: pipeline.id,
      },
    });

    // Move existing stages back to positions 1+
    const finalShifts = pipeline.stages.map((s, i) =>
      prisma.stage.update({
        where: { id: s.id },
        data: { orderIndex: i + 1 },
      })
    );
    await prisma.$transaction(finalShifts);

    const updated = await prisma.stage.findMany({
      where: { pipelineId: pipeline.id },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({
      success: true,
      stageId: stage.id,
      stages: updated.map(s => ({ name: s.name, orderIndex: s.orderIndex })),
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
