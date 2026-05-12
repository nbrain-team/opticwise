import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEditor } from "@/lib/require-editor";

export async function GET() {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const rows = await prisma.insight.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ insights: rows });
}

export async function POST(req: NextRequest) {
  const gate = await requireEditor();
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "Untitled draft";
  const slugRaw = typeof body.slug === "string" ? body.slug.trim() : "";
  const slug =
    slugRaw ||
    `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const existing = await prisma.insight.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "Slug already in use. Pick another slug." },
      { status: 400 }
    );
  }

  const row = await prisma.insight.create({
    data: {
      slug,
      title,
      authorId: gate.session.userId,
      status: "draft",
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ insight: row }, { status: 201 });
}
