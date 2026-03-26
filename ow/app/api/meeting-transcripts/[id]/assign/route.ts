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
    select: { id: true },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const updateData: Record<string, string | null> = {};

  if ("dealId" in body) {
    updateData.dealId = body.dealId || null;
  }
  if ("personId" in body) {
    updateData.personId = body.personId || null;
  }
  if ("organizationId" in body) {
    updateData.organizationId = body.organizationId || null;
  }

  // When assigning a deal, auto-link the deal's org and person if not explicitly set
  if (body.dealId && !("personId" in body) && !("organizationId" in body)) {
    const deal = await prisma.deal.findUnique({
      where: { id: body.dealId },
      select: { personId: true, organizationId: true },
    });
    if (deal) {
      if (deal.personId) updateData.personId = deal.personId;
      if (deal.organizationId)
        updateData.organizationId = deal.organizationId;
    }
  }

  const updated = await prisma.readAIMeeting.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, id: updated.id });
}
