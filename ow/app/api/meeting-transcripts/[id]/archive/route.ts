import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const meeting = await prisma.readAIMeeting.findUnique({
    where: { id },
    select: { id: true, archivedAt: true },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const archivedAt = body.archive === false ? null : new Date();

  const updated = await prisma.readAIMeeting.update({
    where: { id },
    data: { archivedAt },
    select: { id: true, archivedAt: true },
  });

  return NextResponse.json({ success: true, ...updated });
}
