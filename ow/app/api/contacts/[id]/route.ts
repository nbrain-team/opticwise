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

    // Required string fields
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;

    // Nullable string fields
    const nullableStringFields = [
      "name", "email", "phone", "phoneWork", "phoneHome", "phoneMobile", "phoneOther",
      "emailWork", "emailHome", "emailOther", "title", "labels", "contactType",
      "postalAddress", "streetAddress", "houseNumber", "apartmentSuite",
      "city", "state", "region", "country", "zipCode", "latitude", "longitude",
      "notes", "linkedInProfile", "qwilrProposal", "classification",
      "instantMessenger", "marketingStatus", "doubleOptIn", "profilePicture",
    ];
    for (const field of nullableStringFields) {
      if (body[field] !== undefined) updateData[field] = toNullIfEmpty(body[field]);
    }

    // Foreign key
    if (body.organizationId !== undefined) updateData.organizationId = toNullIfEmpty(body.organizationId);

    // Nullable int fields
    const nullableIntFields = [
      "openDeals", "wonDeals", "lostDeals", "closedDeals",
      "totalActivities", "doneActivities", "activitiesToDo", "emailMessagesCount",
    ];
    for (const field of nullableIntFields) {
      if (body[field] !== undefined) updateData[field] = toInt(body[field]);
    }

    // Date fields
    const dateFields = [
      "birthday", "nextActivityDate", "lastActivityDate",
      "lastEmailReceived", "lastEmailSent",
    ];
    for (const field of dateFields) {
      if (body[field] !== undefined) updateData[field] = toDateOrNull(body[field]);
    }

    const person = await prisma.person.update({
      where: { id },
      data: updateData,
      include: {
        organization: true,
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
        },
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update contact" },
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

    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        deals: true,
      },
    });

    if (!person) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    await prisma.person.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Contact deleted successfully",
      dealsAffected: person.deals.length 
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete contact" },
      { status: 500 }
    );
  }
}
