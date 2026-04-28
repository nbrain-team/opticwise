import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * One-shot lookups endpoint for the Forms editor: pipelines (with stages) +
 * active users. Internal-auth only. Returns minimal fields.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [pipelines, users] = await Promise.all([
    prisma.pipeline.findMany({
      include: {
        stages: {
          orderBy: { orderIndex: "asc" },
          select: { id: true, name: true, orderIndex: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
  ]);

  return NextResponse.json({
    pipelines: pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      stages: p.stages,
    })),
    users,
  });
}
