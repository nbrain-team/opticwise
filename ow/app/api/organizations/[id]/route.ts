import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toNullIfEmpty, toInt, toDateOrNull } from "@/lib/api-sanitize";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    // Name (required, unique)
    if (body.name !== undefined) updateData.name = body.name;

    // Nullable string fields
    const nullableStringFields = [
      "address", "websiteUrl", "domain", "linkedInProfile", "industry",
      "annualRevenue", "numberOfEmployees", "doors", "labels", "profilePicture",
      "streetAddress", "houseNumber", "apartmentSuite", "district",
      "city", "state", "region", "country", "zipCode", "fullAddress",
      "latitude", "longitude",
    ];
    for (const field of nullableStringFields) {
      if (body[field] !== undefined) updateData[field] = toNullIfEmpty(body[field]);
    }

    // Nullable int fields
    const nullableIntFields = [
      "openDeals", "wonDeals", "lostDeals", "closedDeals",
      "totalActivities", "doneActivities", "activitiesToDo", "emailMessagesCount",
    ];
    for (const field of nullableIntFields) {
      if (body[field] !== undefined) updateData[field] = toInt(body[field]);
    }

    // Date fields
    if (body.nextActivityDate !== undefined) updateData.nextActivityDate = toDateOrNull(body.nextActivityDate);
    if (body.lastActivityDate !== undefined) updateData.lastActivityDate = toDateOrNull(body.lastActivityDate);

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData,
      include: {
        people: true,
        deals: {
          include: {
            stage: true,
            owner: true,
          },
        },
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update organization" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        people: true,
        deals: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Organization deleted successfully",
      peopleAffected: organization.people.length,
      dealsAffected: organization.deals.length
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete organization" },
      { status: 500 }
    );
  }
}
