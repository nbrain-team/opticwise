import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: { orderBy: { orderIndex: "asc" } },
      _count: { select: { deals: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ pipelines });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, stages } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Pipeline name is required" }, { status: 400 });
  }

  const pipeline = await prisma.pipeline.create({
    data: {
      name: name.trim(),
      stages: {
        create: (stages || []).map((s: { name: string }, i: number) => ({
          name: s.name.trim(),
          orderIndex: i,
        })),
      },
    },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });

  return NextResponse.json({ pipeline }, { status: 201 });
}
