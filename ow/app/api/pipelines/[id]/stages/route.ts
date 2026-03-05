import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: pipelineId } = await params;
  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Stage name is required" }, { status: 400 });
  }

  const maxOrder = await prisma.stage.aggregate({
    where: { pipelineId },
    _max: { orderIndex: true },
  });

  const stage = await prisma.stage.create({
    data: {
      name: name.trim(),
      orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      pipelineId,
    },
  });

  return NextResponse.json({ stage }, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: pipelineId } = await params;
  const { stages } = await request.json();

  if (!Array.isArray(stages)) {
    return NextResponse.json({ error: "stages array required" }, { status: 400 });
  }

  const updates = stages.map((s: { id: string; name: string; orderIndex: number }) =>
    prisma.stage.update({
      where: { id: s.id },
      data: { name: s.name.trim(), orderIndex: s.orderIndex },
    })
  );

  await prisma.$transaction(updates);

  const updated = await prisma.stage.findMany({
    where: { pipelineId },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ stages: updated });
}
