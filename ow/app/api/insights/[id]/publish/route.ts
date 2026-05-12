import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEditor } from "@/lib/require-editor";
import { publishInsightToGitHub } from "@/lib/insights/publish";
import { computeReadingMinutes } from "@/lib/insights/render-post-html";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const { id } = await params;

  const full = await prisma.insight.findUnique({
    where: { id },
    include: { assets: true, author: true },
  });

  if (!full) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { sha } = await publishInsightToGitHub(full);
    const hero = full.assets.find((a) => a.kind === "hero");
    const rt = computeReadingMinutes(full.bodyHtml);

    const updated = await prisma.insight.update({
      where: { id },
      data: {
        status: "published",
        publishedCommitSha: sha,
        heroImagePath: hero
          ? `images/insights/${full.slug}/${hero.filename}`
          : full.heroImagePath,
        scheduledFor: null,
        readingTimeMinutes: rt,
        datePublished: full.datePublished ?? new Date(),
      },
      include: {
        assets: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, commitSha: sha, insight: updated });
  } catch (e) {
    console.error("publish", e);
    const msg = e instanceof Error ? e.message : "Publish failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
