import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 500);

  const form = await prisma.form.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const submissions = await prisma.formSubmission.findMany({
    where: {
      formId: id,
      ...(status ? { status: status as "processed" | "failed" | "spam" } : {}),
    },
    include: {
      person: { select: { id: true, firstName: true, lastName: true, email: true } },
      organization: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true, value: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ form, submissions });
}
