import { prisma } from "@/lib/db";

/**
 * Finds the active pipeline consistently across the platform.
 * Uses the first (oldest) pipeline as default.
 */
export async function getActivePipeline() {
  return prisma.pipeline.findFirst({
    include: { stages: { orderBy: { orderIndex: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Gets all pipelines for the pipeline switcher.
 */
export async function getAllPipelines() {
  return prisma.pipeline.findMany({
    include: { stages: { orderBy: { orderIndex: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}
