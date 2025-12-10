import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Create a new activity
 * POST /api/activities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      subject,
      note,
      type,
      dueDate,
      dueTime,
      duration,
      dealId,
      personId,
      organizationId,
      assignedTo,
      createdBy,
    } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    // Ensure at least one entity is linked
    if (!dealId && !personId && !organizationId) {
      return NextResponse.json(
        { error: "Must link activity to a deal, person, or organization" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        subject: subject.trim(),
        note: note?.trim() || null,
        type: type || "task",
        status: "pending",
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime: dueTime || null,
        duration: duration || null,
        dealId: dealId || null,
        personId: personId || null,
        organizationId: organizationId || null,
        assignedTo: assignedTo || null,
        createdBy: createdBy || null,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get activities with optional filtering
 * GET /api/activities?dealId=xxx or ?personId=xxx or ?organizationId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dealId = searchParams.get("dealId");
    const personId = searchParams.get("personId");
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (dealId) where.dealId = dealId;
    if (personId) where.personId = personId;
    if (organizationId) where.organizationId = organizationId;
    if (status) where.status = status;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: [
        { status: "asc" }, // pending first
        { dueDate: "asc" }, // earliest due date first
        { createdAt: "desc" }, // newest first
      ],
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities", details: String(error) },
      { status: 500 }
    );
  }
}
