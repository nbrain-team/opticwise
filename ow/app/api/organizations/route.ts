import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * GET /api/organizations
 * List organizations with optional search and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "100");
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [organizations, totalCount] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: {
              people: true,
              deals: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: perPage,
      }),
      prisma.organization.count({ where }),
    ]);

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    });
  } catch (error) {
    console.error("Error listing organizations:", error);
    return NextResponse.json(
      { error: "Failed to list organizations", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      domain,
      websiteUrl,
      industry,
      linkedInProfile,
      annualRevenue,
      numberOfEmployees,
      city,
      state,
      country,
      address,
      labels,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Check if organization already exists
    const existing = await prisma.organization.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An organization with this name already exists", existing },
        { status: 409 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        domain: domain || undefined,
        websiteUrl: websiteUrl || undefined,
        industry: industry || undefined,
        linkedInProfile: linkedInProfile || undefined,
        annualRevenue: annualRevenue || undefined,
        numberOfEmployees: numberOfEmployees || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        address: address || undefined,
        labels: labels || undefined,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization", details: String(error) },
      { status: 500 }
    );
  }
}
