import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, company, phone, propertyType, message } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400, headers: corsHeaders() });
    }

    // Find or create organization
    let organizationId: string | undefined;
    if (company?.trim()) {
      const org = await prisma.organization.upsert({
        where: { name: company.trim() },
        update: {},
        create: { name: company.trim() },
      });
      organizationId = org.id;
    }

    // Find or create person
    let personId: string | undefined;
    const existingPerson = await prisma.person.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingPerson) {
      personId = existingPerson.id;
    } else {
      const person = await prisma.person.create({
        data: {
          firstName: firstName?.trim() || "",
          lastName: lastName?.trim() || "",
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          organizationId,
        },
      });
      personId = person.id;
    }

    // Find the "Schedule Review" stage in "New Projects Pipeline"
    const pipeline = await prisma.pipeline.findFirst({
      where: { name: "New Projects Pipeline" },
      include: { stages: { orderBy: { orderIndex: "asc" } } },
    });

    if (!pipeline || pipeline.stages.length === 0) {
      return NextResponse.json(
        { error: "Pipeline not configured" },
        { status: 500, headers: corsHeaders() }
      );
    }

    const scheduleStage = pipeline.stages.find(s => s.name === "Schedule Review") || pipeline.stages[0];

    // Find admin user for deal ownership
    const adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found" },
        { status: 500, headers: corsHeaders() }
      );
    }

    const maxPos = await prisma.deal.aggregate({
      where: { stageId: scheduleStage.id, pipelineId: pipeline.id },
      _max: { position: true },
    });

    const dealTitle = company?.trim()
      ? `${company.trim()} - Schedule Review`
      : `${firstName?.trim() || ""} ${lastName?.trim() || ""} - Schedule Review`.trim();

    const deal = await prisma.deal.create({
      data: {
        title: dealTitle,
        value: 0,
        currency: "USD",
        pipelineId: pipeline.id,
        stageId: scheduleStage.id,
        position: (maxPos._max.position ?? 0) + 1,
        organizationId,
        personId,
        ownerId: adminUser.id,
        propertyType: propertyType?.trim() || null,
        leadSource: "Website - Schedule Review Form",
      },
    });

    // Store the message as a note if provided
    if (message?.trim()) {
      await prisma.note.create({
        data: {
          content: `Schedule Review form submission:\n\n${message.trim()}`,
          dealId: deal.id,
          personId,
          organizationId,
        },
      });
    }

    return NextResponse.json(
      { success: true, dealId: deal.id },
      { status: 201, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Error processing schedule review:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
