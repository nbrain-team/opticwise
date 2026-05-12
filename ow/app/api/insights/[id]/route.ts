import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEditor } from "@/lib/require-editor";
import { lintInsightMarkdownLite } from "@/lib/insights/sb7-linter";
import type { InsightStatus } from "@prisma/client";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const row = await prisma.insight.findUnique({
    where: { id },
    include: {
      assets: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ insight: row });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const existing = await prisma.insight.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.slug === "string") {
    const s = body.slug.trim().toLowerCase();
    if (s && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      return NextResponse.json(
        {
          error:
            "Slug must be lowercase URL-safe: letters, numbers, single hyphens.",
        },
        { status: 400 }
      );
    }
    if (s && s !== existing.slug) {
      const clash = await prisma.insight.findUnique({ where: { slug: s } });
      if (clash && clash.id !== id) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
      }
      data.slug = s;
    }
  }
  if (typeof body.excerpt === "string") data.excerpt = body.excerpt;
  if (typeof body.bodyHtml === "string") data.bodyHtml = body.bodyHtml;
  if (typeof body.category === "string") data.category = body.category;
  if (Array.isArray(body.secondaryCategories)) {
    data.secondaryCategories = body.secondaryCategories.filter(
      (x: unknown) => typeof x === "string"
    ) as string[];
  }
  if (typeof body.seoTitle === "string") data.seoTitle = body.seoTitle || null;
  if (typeof body.seoDescription === "string")
    data.seoDescription = body.seoDescription || null;
  if (typeof body.twitterTitle === "string")
    data.twitterTitle = body.twitterTitle || null;
  if (typeof body.twitterDescription === "string")
    data.twitterDescription = body.twitterDescription || null;
  if (typeof body.twitterImagePath === "string")
    data.twitterImagePath = body.twitterImagePath || null;
  if (typeof body.authorSlug === "string")
    data.authorSlug = body.authorSlug || null;
  if (typeof body.readingTimeMinutes === "number")
    data.readingTimeMinutes = body.readingTimeMinutes;

  if (Array.isArray(body.topicClusterPaths)) {
    data.topicClusterPaths = body.topicClusterPaths.filter(
      (x: unknown) => typeof x === "string"
    ) as string[];
  }

  if (body.datePublished != null) {
    const d = new Date(body.datePublished as string);
    if (!isNaN(d.getTime())) data.datePublished = d;
  }

  if (body.scheduledFor !== undefined) {
    if (body.scheduledFor === null) data.scheduledFor = null;
    else {
      const d = new Date(body.scheduledFor as string);
      if (!isNaN(d.getTime())) data.scheduledFor = d;
    }
  }

  if (typeof body.status === "string") {
    const st = body.status as InsightStatus;
    if (!["draft", "scheduled", "published"].includes(st)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = st;
  }

  const updated = await prisma.insight.update({
    where: { id },
    data,
    include: {
      assets: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  const lint = lintInsightMarkdownLite(
    `${updated.title}\n${updated.excerpt}\n${updated.bodyHtml}`
  );

  return NextResponse.json({ insight: updated, lint });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const existing = await prisma.insight.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "published") {
    return NextResponse.json(
      { error: "Delete not allowed for published insights in v1" },
      { status: 400 }
    );
  }

  await prisma.insight.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
