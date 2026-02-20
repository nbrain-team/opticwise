import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_ROLES = [
  "champion",
  "decision_maker",
  "technical_evaluator",
  "influencer",
  "end_user",
  "other",
];

/**
 * GET /api/deals/[id]/contacts
 * List all contacts (stakeholders) associated with a deal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dealContacts = await prisma.dealContact.findMany({
      where: { dealId: id },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            emailWork: true,
            title: true,
            phoneMobile: true,
            phoneWork: true,
            organizationId: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(dealContacts);
  } catch (error) {
    console.error("Error fetching deal contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal contacts", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deals/[id]/contacts
 * Add a contact (stakeholder) to a deal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { personId, role, isPrimary, notes } = body;

    if (!personId) {
      return NextResponse.json(
        { error: "personId is required" },
        { status: 400 }
      );
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // If setting as primary, unset any existing primary
    if (isPrimary) {
      await prisma.dealContact.updateMany({
        where: { dealId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const dealContact = await prisma.dealContact.upsert({
      where: {
        dealId_personId: { dealId: id, personId },
      },
      update: {
        role: role || undefined,
        isPrimary: isPrimary ?? undefined,
        notes: notes ?? undefined,
      },
      create: {
        dealId: id,
        personId,
        role: role || null,
        isPrimary: isPrimary ?? false,
        notes: notes || null,
      },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
          },
        },
      },
    });

    // Also update the deal's primary personId if this is set as primary
    if (isPrimary) {
      await prisma.deal.update({
        where: { id },
        data: { personId },
      });
    }

    return NextResponse.json(dealContact, { status: 201 });
  } catch (error) {
    console.error("Error adding deal contact:", error);
    return NextResponse.json(
      { error: "Failed to add deal contact", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deals/[id]/contacts
 * Remove a contact from a deal (pass personId in body)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { personId } = body;

    if (!personId) {
      return NextResponse.json(
        { error: "personId is required" },
        { status: 400 }
      );
    }

    await prisma.dealContact.delete({
      where: {
        dealId_personId: { dealId: id, personId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing deal contact:", error);
    return NextResponse.json(
      { error: "Failed to remove deal contact", details: String(error) },
      { status: 500 }
    );
  }
}
