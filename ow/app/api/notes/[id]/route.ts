import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Update a note
 * PATCH /api/notes/[id]
 * Body: { content: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const note = await prisma.note.update({
      where: { id },
      data: { content: content.trim() },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Delete a note
 * DELETE /api/notes/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note", details: String(error) },
      { status: 500 }
    );
  }
}

