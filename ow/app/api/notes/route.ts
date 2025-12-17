import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Create a new note
 * POST /api/notes
 * Body: { content: string, dealId?: string, personId?: string, organizationId?: string, createdBy?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, dealId, personId, organizationId, createdBy } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Ensure at least one entity is linked
    if (!dealId && !personId && !organizationId) {
      return NextResponse.json(
        { error: "Must link note to a deal, person, or organization" },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        dealId: dealId || null,
        personId: personId || null,
        organizationId: organizationId || null,
        createdBy: createdBy || null,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get notes with optional filtering
 * GET /api/notes?dealId=xxx or ?personId=xxx or ?organizationId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dealId = searchParams.get("dealId");
    const personId = searchParams.get("personId");
    const organizationId = searchParams.get("organizationId");

    const where: Record<string, unknown> = {};
    if (dealId) where.dealId = dealId;
    if (personId) where.personId = personId;
    if (organizationId) where.organizationId = organizationId;

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes", details: String(error) },
      { status: 500 }
    );
  }
}

