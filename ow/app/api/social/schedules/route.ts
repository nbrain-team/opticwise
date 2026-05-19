import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedules = await prisma.deliverableSchedule.findMany({
    include: {
      targetAccount: {
        select: {
          id: true,
          displayName: true,
          platform: true,
          accountType: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ schedules });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { deliverableType, targetAccountId, cadence, defaultPostTime, timezone, isActive } =
    body as {
      deliverableType?: string;
      targetAccountId?: string;
      cadence?: Record<string, unknown>;
      defaultPostTime?: string;
      timezone?: string;
      isActive?: boolean;
    };

  if (!deliverableType || !targetAccountId) {
    return NextResponse.json(
      { error: "deliverableType and targetAccountId are required" },
      { status: 400 }
    );
  }

  const account = await prisma.socialAccount.findUnique({
    where: { id: targetAccountId },
  });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const schedule = await prisma.deliverableSchedule.upsert({
    where: {
      deliverableType_targetAccountId: {
        deliverableType,
        targetAccountId,
      },
    },
    update: {
      cadence: cadence || { frequency: "weekly", days: [] },
      defaultPostTime: defaultPostTime || "08:00",
      timezone: timezone || "America/Denver",
      isActive: isActive ?? true,
    },
    create: {
      deliverableType,
      targetAccountId,
      cadence: cadence || { frequency: "weekly", days: [] },
      defaultPostTime: defaultPostTime || "08:00",
      timezone: timezone || "America/Denver",
      isActive: isActive ?? true,
    },
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

  return NextResponse.json({ schedule }, { status: 201 });
}
