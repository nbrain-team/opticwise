import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

// GET /api/conferences - List all conferences
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: { status?: string } = {};
    if (status) where.status = status;

    const conferences = await prisma.conference.findMany({
      where,
      include: {
        _count: {
          select: {
            attendees: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json({ conferences });
  } catch (error) {
    console.error('Error fetching conferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conferences' },
      { status: 500 }
    );
  }
}

// POST /api/conferences - Create a new conference
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      location,
      venue,
      startDate,
      endDate,
      websiteUrl,
      registrationUrl,
      boothNumber,
      teamMembers,
      targetMeetings,
      targetLeads,
      booksToDistribute,
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      );
    }

    const conference = await prisma.conference.create({
      data: {
        name,
        description,
        location,
        venue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        websiteUrl,
        registrationUrl,
        boothNumber,
        teamMembers,
        targetMeetings,
        targetLeads,
        booksToDistribute,
        status: 'upcoming',
      },
    });

    return NextResponse.json({ conference }, { status: 201 });
  } catch (error) {
    console.error('Error creating conference:', error);
    return NextResponse.json(
      { error: 'Failed to create conference' },
      { status: 500 }
    );
  }
}

