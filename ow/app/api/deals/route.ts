import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    title,
    value,
    currency = "USD",
    pipelineId,
    stageId,
    organizationName,
    personFirstName,
    personLastName,
    expectedCloseDate,
    probability,
  } = body || {};

  if (!title || !pipelineId || !stageId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let organizationId: string | undefined = undefined;
  if (organizationName) {
    const org = await prisma.organization.upsert({
      where: { name: organizationName },
      update: {},
      create: { name: organizationName },
    });
    organizationId = org.id;
  }

  let personId: string | undefined = undefined;
  if (personFirstName || personLastName) {
    const p = await prisma.person.create({
      data: {
        firstName: personFirstName || "",
        lastName: personLastName || "",
        organizationId,
      },
    });
    personId = p.id;
  }

  const maxPos = await prisma.deal.aggregate({
    where: { stageId, pipelineId },
    _max: { position: true },
  });
  const nextPos = (maxPos._max.position ?? 0) + 1;

  const deal = await prisma.deal.create({
    data: {
      title,
      value: value ?? 0,
      currency,
      pipelineId,
      stageId,
      position: nextPos,
      organizationId,
      personId,
      ownerId: session.userId,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      probability: probability ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, deal }, { status: 201 });
}


