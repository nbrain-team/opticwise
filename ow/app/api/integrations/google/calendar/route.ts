import { NextRequest, NextResponse } from 'next/server';
import { getServiceAccountClient, getCalendarClient } from '@/lib/google';

/**
 * Get calendar events (using service account)
 * GET /api/integrations/google/calendar?maxResults=10&timeMin=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const calendarId = searchParams.get('calendarId') || 'primary';

    const auth = getServiceAccountClient();
    const calendar = await getCalendarClient(auth);

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json({
      events: response.data.items || [],
      summary: response.data.summary,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Create a calendar event (using service account)
 * POST /api/integrations/google/calendar
 * Body: { summary, description, start, end, attendees }
 */
export async function POST(request: NextRequest) {
  try {
    const { summary, description, start, end, attendees, calendarId = 'primary' } = await request.json();

    if (!summary || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, start, end' },
        { status: 400 }
      );
    }

    const auth = getServiceAccountClient();
    const calendar = await getCalendarClient(auth);

    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: end,
        timeZone: 'America/Los_Angeles',
      },
      attendees: attendees?.map((email: string) => ({ email })) || [],
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return NextResponse.json({
      success: true,
      event: response.data,
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event', details: String(error) },
      { status: 500 }
    );
  }
}







