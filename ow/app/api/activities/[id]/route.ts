import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Update an activity
 * PATCH /api/activities/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subject, note, type, status, dueDate, dueTime, duration, assignedTo } = body;

    const updateData: Record<string, unknown> = {};
    
    if (subject !== undefined) updateData.subject = subject.trim();
    if (note !== undefined) updateData.note = note?.trim() || null;
    if (type !== undefined) updateData.type = type;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (dueTime !== undefined) updateData.dueTime = dueTime || null;
    if (duration !== undefined) updateData.duration = duration || null;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    
    // Handle status change
    if (status !== undefined) {
      updateData.status = status;
      if (status === "done") {
        updateData.doneTime = new Date();
        // Could also set markedAsDoneBy if you have user context
      } else if (status === "pending") {
        updateData.doneTime = null;
        updateData.markedAsDoneBy = null;
      }
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Delete an activity
 * DELETE /api/activities/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity", details: String(error) },
      { status: 500 }
    );
  }
}

