import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH - Update an organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, people, deals, ...updateData } = body;

    // Handle date fields
    if (updateData.nextActivityDate) {
      updateData.nextActivityDate = new Date(updateData.nextActivityDate);
    }
    if (updateData.lastActivityDate) {
      updateData.lastActivityDate = new Date(updateData.lastActivityDate);
    }

    // Update the organization
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

// DELETE - Delete an organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if organization has people or deals
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

    // Delete the organization (people and deals will be set to null via onDelete: SetNull)
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





