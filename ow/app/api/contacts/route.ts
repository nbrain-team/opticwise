import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * GET /api/contacts
 * List contacts with optional search, pagination, and organization filter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "100");
    const organizationId = searchParams.get("organizationId");
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { emailWork: { contains: search, mode: "insensitive" } },
        { organization: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const [contacts, totalCount] = await Promise.all([
      prisma.person.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true } },
          deals: {
            where: { status: "open" },
            select: { id: true, title: true, value: true, currency: true },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: perPage,
      }),
      prisma.person.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    });
  } catch (error) {
    console.error("Error listing contacts:", error);
    return NextResponse.json(
      { error: "Failed to list contacts", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * Create a new contact, optionally linking to an organization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      emailWork,
      emailHome,
      phone,
      phoneWork,
      phoneMobile,
      title,
      organizationId,
      organizationName,
      linkedInProfile,
      city,
      state,
      country,
      notes,
      contactType,
      labels,
    } = body;

    if (!firstName && !lastName && !email) {
      return NextResponse.json(
        { error: "At least a name or email is required" },
        { status: 400 }
      );
    }

    // If organizationName provided but no organizationId, find or create org
    let resolvedOrgId = organizationId || undefined;
    if (!resolvedOrgId && organizationName) {
      const org = await prisma.organization.upsert({
        where: { name: organizationName },
        update: {},
        create: { name: organizationName },
      });
      resolvedOrgId = org.id;
    }

    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    const person = await prisma.person.create({
      data: {
        firstName: firstName || "",
        lastName: lastName || "",
        name: fullName || undefined,
        email: email || undefined,
        emailWork: emailWork || undefined,
        emailHome: emailHome || undefined,
        phone: phone || undefined,
        phoneWork: phoneWork || undefined,
        phoneMobile: phoneMobile || undefined,
        title: title || undefined,
        organizationId: resolvedOrgId,
        linkedInProfile: linkedInProfile || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        notes: notes || undefined,
        contactType: contactType || undefined,
        labels: labels || undefined,
      },
      include: {
        organization: true,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact", details: String(error) },
      { status: 500 }
    );
  }
}
