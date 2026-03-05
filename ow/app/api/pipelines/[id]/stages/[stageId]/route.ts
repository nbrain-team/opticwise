import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stageId } = await params;
  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Stage name is required" }, { status: 400 });
  }

  const stage = await prisma.stage.update({
    where: { id: stageId },
    data: { name: name.trim() },
  });

  return NextResponse.json({ stage });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: pipelineId, stageId } = await params;

  const dealCount = await prisma.deal.count({ where: { stageId } });
  if (dealCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete stage with ${dealCount} deal(s). Move or delete them first.` },
      { status: 400 }
    );
  }

  await prisma.stage.delete({ where: { id: stageId } });

  const remaining = await prisma.stage.findMany({
    where: { pipelineId },
    orderBy: { orderIndex: "asc" },
  });
  const reorder = remaining.map((s, i) =>
    prisma.stage.update({ where: { id: s.id }, data: { orderIndex: i } })
  );
  if (reorder.length > 0) await prisma.$transaction(reorder);

  return NextResponse.json({ success: true });
}
