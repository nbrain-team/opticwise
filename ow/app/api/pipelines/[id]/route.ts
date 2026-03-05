import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Pipeline name is required" }, { status: 400 });
  }

  const pipeline = await prisma.pipeline.update({
    where: { id },
    data: { name: name.trim() },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });

  return NextResponse.json({ pipeline });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const pipelineCount = await prisma.pipeline.count();
  if (pipelineCount <= 1) {
    return NextResponse.json({ error: "Cannot delete the last pipeline" }, { status: 400 });
  }

  const dealCount = await prisma.deal.count({ where: { pipelineId: id } });

  await prisma.pipeline.delete({ where: { id } });

  return NextResponse.json({ success: true, dealsDeleted: dealCount });
}
