import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH - Update a deal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { addTime, updateTime, pipeline, stage, organization, person, owner, ...updateData } = body;

    // Handle decimal fields
    if (updateData.value !== undefined) {
      updateData.value = parseFloat(updateData.value);
    }
    if (updateData.productAmount !== undefined) {
      updateData.productAmount = updateData.productAmount ? parseFloat(updateData.productAmount) : null;
    }
    if (updateData.mrr !== undefined) {
      updateData.mrr = updateData.mrr ? parseFloat(updateData.mrr) : null;
    }
    if (updateData.arr !== undefined) {
      updateData.arr = updateData.arr ? parseFloat(updateData.arr) : null;
    }
    if (updateData.acv !== undefined) {
      updateData.acv = updateData.acv ? parseFloat(updateData.acv) : null;
    }
    if (updateData.arrForecast !== undefined) {
      updateData.arrForecast = updateData.arrForecast ? parseFloat(updateData.arrForecast) : null;
    }
    if (updateData.capexRom !== undefined) {
      updateData.capexRom = updateData.capexRom ? parseFloat(updateData.capexRom) : null;
    }
    if (updateData.auditValue !== undefined) {
      updateData.auditValue = updateData.auditValue ? parseFloat(updateData.auditValue) : null;
    }
    if (updateData.arrExpansionPotential !== undefined) {
      updateData.arrExpansionPotential = updateData.arrExpansionPotential ? parseFloat(updateData.arrExpansionPotential) : null;
    }

    // Handle date fields
    if (updateData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(updateData.expectedCloseDate);
    }
    if (updateData.wonTime) {
      updateData.wonTime = new Date(updateData.wonTime);
    }
    if (updateData.lostTime) {
      updateData.lostTime = new Date(updateData.lostTime);
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

    // Update the deal
    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        pipeline: true,
        stage: true,
        organization: true,
        person: true,
        owner: true,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update deal" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if deal exists
    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    // Delete the deal
    await prisma.deal.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Deal deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete deal" },
      { status: 500 }
    );
  }
}

