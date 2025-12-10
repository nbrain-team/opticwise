import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH - Update a contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, deals, organization, ...updateData } = body;

    // Handle date fields
    if (updateData.birthday) {
      updateData.birthday = new Date(updateData.birthday);
    }
    if (updateData.nextActivityDate) {
      updateData.nextActivityDate = new Date(updateData.nextActivityDate);
    }
    if (updateData.lastActivityDate) {
      updateData.lastActivityDate = new Date(updateData.lastActivityDate);
    }
    if (updateData.lastEmailReceived) {
      updateData.lastEmailReceived = new Date(updateData.lastEmailReceived);
    }
    if (updateData.lastEmailSent) {
      updateData.lastEmailSent = new Date(updateData.lastEmailSent);
    }

    // Update the person
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

// DELETE - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if contact has deals
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

    // Delete the person (deals will be set to null via onDelete: SetNull)
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
