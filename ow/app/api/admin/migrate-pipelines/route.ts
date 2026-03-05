import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MIGRATION_SECRET = "ow-pipeline-migrate-2026-03-05";

export async function POST(request: NextRequest) {
  const { secret } = await request.json();
  if (secret !== MIGRATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  const results: string[] = [];

  // 1. Create MTU Tenant Pipeline if it doesn't exist
  const existing = await prisma.pipeline.findFirst({ where: { name: "MTU Tenant Pipeline" } });
  if (!existing) {
    await prisma.pipeline.create({
      data: {
        name: "MTU Tenant Pipeline",
        stages: {
          create: [
            { name: "Tenant Identified", orderIndex: 0 },
            { name: "Contacted", orderIndex: 1 },
            { name: "Solution Defined", orderIndex: 2 },
            { name: "Proposal Made", orderIndex: 3 },
            { name: "Negotiations Started", orderIndex: 4 },
          ],
        },
      },
    });
    results.push("Created MTU Tenant Pipeline with 5 stages");
  } else {
    results.push("MTU Tenant Pipeline already exists - skipped");
  }

  // 2. Delete Sales Pipeline and all its deals/stages
  const salesPipeline = await prisma.pipeline.findFirst({ where: { name: "Sales Pipeline" } });
  if (salesPipeline) {
    const dealCount = await prisma.deal.count({ where: { pipelineId: salesPipeline.id } });
    const stageCount = await prisma.stage.count({ where: { pipelineId: salesPipeline.id } });

    // Must delete deals first to avoid FK issues with other tables
    await prisma.deal.deleteMany({ where: { pipelineId: salesPipeline.id } });
    await prisma.pipeline.delete({ where: { id: salesPipeline.id } });

    results.push(`Deleted Sales Pipeline: ${dealCount} deals, ${stageCount} stages removed`);
  } else {
    results.push("Sales Pipeline not found - skipped");
  }

  // 3. Summary
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: { orderBy: { orderIndex: "asc" } },
      _count: { select: { deals: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    success: true,
    results,
    pipelines: pipelines.map(p => ({
      name: p.name,
      dealCount: p._count.deals,
      stages: p.stages.map(s => s.name),
    })),
  });
}
