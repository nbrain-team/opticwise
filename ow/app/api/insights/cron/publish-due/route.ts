import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishInsightToGitHub } from "@/lib/insights/publish";

function authCron(req: NextRequest): boolean {
  const secret = process.env.INSIGHTS_CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const q = req.nextUrl.searchParams.get("secret");
  return auth === `Bearer ${secret}` || q === secret;
}

async function runDuePublishes() {
  const now = new Date();
  const due = await prisma.insight.findMany({
    where: {
      status: "scheduled",
      scheduledFor: { lte: now },
    },
    include: { assets: true, author: true },
  });

  const results: { id: string; slug: string; ok: boolean; error?: string }[] =
    [];

  for (const row of due) {
    try {
      const { sha } = await publishInsightToGitHub(row);
      const hero = row.assets.find((a) => a.kind === "hero");
      await prisma.insight.update({
        where: { id: row.id },
        data: {
          status: "published",
          publishedCommitSha: sha,
          heroImagePath: hero
            ? `images/insights/${row.slug}/${hero.filename}`
            : row.heroImagePath,
          scheduledFor: null,
          datePublished: row.datePublished ?? now,
        },
      });
      results.push({ id: row.id, slug: row.slug, ok: true });
    } catch (e) {
      results.push({
        id: row.id,
        slug: row.slug,
        ok: false,
        error: e instanceof Error ? e.message : "error",
      });
    }
  }

  return { processed: results.length, results };
}

export async function GET(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const out = await runDuePublishes();
  return NextResponse.json(out);
}

export async function POST(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const out = await runDuePublishes();
  return NextResponse.json(out);
}
