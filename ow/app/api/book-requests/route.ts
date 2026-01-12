import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/db';

// POST /api/book-requests - Submit book request (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      firstName,
      lastName,
      company,
      title,
      phone,
      type, // digital, physical, both
      format, // pdf, epub, kindle
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      source,
      campaignId,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!email || !name || !type) {
      return NextResponse.json(
        { error: 'Email, name, and type are required' },
        { status: 400 }
      );
    }

    // Check if person exists in CRM
    const existingPerson = await prisma.person.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    // Check if organization exists
    let organizationId = existingPerson?.organizationId;
    if (!organizationId && company) {
      const existingOrg = await prisma.organization.findFirst({
        where: { name: company },
      });
      organizationId = existingOrg?.id;
    }

    // Create book request
    const bookRequest = await prisma.bookRequest.create({
      data: {
        email,
        name,
        firstName,
        lastName,
        company,
        title,
        phone,
        personId: existingPerson?.id,
        organizationId,
        type,
        format,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry,
        source,
        campaignId,
        utmSource,
        utmMedium,
        utmCampaign,
        status: type === 'digital' ? 'downloaded' : 'pending',
        ...(type === 'digital' && { downloadedAt: new Date() }),
      },
    });

    // Generate download link for digital books
    const downloadLink = type === 'digital' || type === 'both'
      ? `/api/book-requests/${bookRequest.id}/download`
      : null;

    return NextResponse.json({
      success: true,
      bookRequest: {
        id: bookRequest.id,
        type: bookRequest.type,
      },
      downloadLink,
      message: type === 'physical'
        ? 'Thank you! Your book will be shipped within 3-5 business days.'
        : 'Thank you! Your digital book is ready for download.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating book request:', error);
    return NextResponse.json(
      { error: 'Failed to submit book request' },
      { status: 500 }
    );
  }
}

// GET /api/book-requests - List book requests (authenticated)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const bookRequests = await prisma.bookRequest.findMany({
      where,
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        convertedToDeal: {
          select: {
            id: true,
            title: true,
            value: true,
          },
        },
        engagements: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 10,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ bookRequests });
  } catch (error) {
    console.error('Error fetching book requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book requests' },
      { status: 500 }
    );
  }
}

