import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * POST /api/contacts/find-or-create
 *
 * Looks up a Person by email across email, emailWork, emailHome.
 * - If found, returns the person (and optionally links to a meeting).
 * - If not found and `create` payload is provided, creates the contact
 *   (with optional org upsert) and optionally links.
 * - If not found and no `create` payload, returns { found: false }.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, meetingId, create } = body as {
    email: string;
    meetingId?: string;
    create?: {
      firstName?: string;
      lastName?: string;
      organizationName?: string;
    };
  };

  if (!email) {
    return NextResponse.json(
      { error: "email is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Look up by any email field
  let person = await prisma.person.findFirst({
    where: {
      OR: [
        { email: { equals: normalizedEmail, mode: "insensitive" } },
        { emailWork: { equals: normalizedEmail, mode: "insensitive" } },
        { emailHome: { equals: normalizedEmail, mode: "insensitive" } },
      ],
    },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (person) {
    if (meetingId) {
      await prisma.readAIMeeting.update({
        where: { id: meetingId },
        data: {
          personId: person.id,
          organizationId: person.organizationId || undefined,
        },
      });
    }
    return NextResponse.json({ found: true, person });
  }

  // Not found — if no create payload, let the client prompt for details
  if (!create) {
    return NextResponse.json({ found: false });
  }

  // Create the contact
  const { firstName, lastName, organizationName } = create;

  let organizationId: string | undefined;
  if (organizationName) {
    const org = await prisma.organization.upsert({
      where: { name: organizationName },
      update: {},
      create: { name: organizationName },
    });
    organizationId = org.id;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  person = await prisma.person.create({
    data: {
      firstName: firstName || "",
      lastName: lastName || "",
      name: fullName || undefined,
      email: normalizedEmail,
      organizationId,
    },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (meetingId) {
    await prisma.readAIMeeting.update({
      where: { id: meetingId },
      data: {
        personId: person.id,
        organizationId: person.organizationId || undefined,
      },
    });
  }

  return NextResponse.json({ found: false, created: true, person }, { status: 201 });
}
