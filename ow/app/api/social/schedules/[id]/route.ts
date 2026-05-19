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
  const body = await request.json().catch(() => ({}));
  const { cadence, defaultPostTime, timezone, isActive } = body as {
    cadence?: Record<string, unknown>;
    defaultPostTime?: string;
    timezone?: string;
    isActive?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (cadence !== undefined) data.cadence = cadence;
  if (defaultPostTime !== undefined) data.defaultPostTime = defaultPostTime;
  if (timezone !== undefined) data.timezone = timezone;
  if (isActive !== undefined) data.isActive = isActive;

  const schedule = await prisma.deliverableSchedule.update({
    where: { id },
    data,
    include: {
      targetAccount: {
        select: {
          id: true,
          displayName: true,
          platform: true,
          accountType: true,
        },
      },
    },
  });

  return NextResponse.json({ schedule });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.deliverableSchedule.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
