import { prisma } from "@/lib/db";

/**
 * Finds the active pipeline consistently across the platform.
 * Priority: "Sales Pipeline" by name, then fallback to oldest pipeline.
 */
export async function getActivePipeline() {
  const named = await prisma.pipeline.findFirst({
    where: { name: "Sales Pipeline" },
    include: { stages: { orderBy: { orderIndex: "asc" } } },
  });
  if (named && named.stages.length > 0) return named;

  const fallback = await prisma.pipeline.findFirst({
    include: { stages: { orderBy: { orderIndex: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return fallback;
}
