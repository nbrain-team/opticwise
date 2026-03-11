import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

const READAI_WEBHOOK_SECRET = process.env.READAI_WEBHOOK_SECRET;

interface ReadAIParticipant {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
}

interface ReadAISpeakerBlock {
  start_time?: string;
  end_time?: string;
  speaker?: { name?: string };
  words?: string;
}

interface ReadAIPayload {
  session_id: string;
  trigger?: string;
  title?: string;
  start_time?: string;
  end_time?: string;
  platform?: string;
  platform_meeting_id?: string;
  participants?: ReadAIParticipant[];
  owner?: ReadAIParticipant;
  summary?: string;
  action_items?: Array<{ text: string }>;
  key_questions?: Array<{ text: string }>;
  topics?: Array<{ text: string }>;
  report_url?: string;
  chapter_summaries?: Array<{
    title: string;
    description: string;
    topics?: Array<{ text: string }>;
  }>;
  transcript?: {
    speaker_blocks?: ReadAISpeakerBlock[];
    speakers?: Array<{ name: string }>;
  };
}

/**
 * POST /api/webhooks/read-ai
 *
 * Receives meeting data from Read AI when a meeting report is generated.
 * Auth: token query parameter must match READAI_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received Read AI webhook');

    const token = request.nextUrl.searchParams.get('token');

    if (!READAI_WEBHOOK_SECRET) {
      console.error('❌ READAI_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (!token || token !== READAI_WEBHOOK_SECRET) {
      console.error('❌ Invalid or missing webhook token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ReadAIPayload = await request.json();

    if (!body.session_id) {
      console.error('❌ No session_id in payload');
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    console.log('📝 Processing Read AI meeting:', body.title || body.session_id);

    const meeting = await handleMeeting(body);

    return NextResponse.json({
      received: true,
      session_id: body.session_id,
      meeting_id: meeting.id,
    });
  } catch (error) {
    console.error('❌ Error processing Read AI webhook:', error);

    return NextResponse.json(
      {
        received: true,
        error: 'Internal processing error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}

async function handleMeeting(data: ReadAIPayload) {
  let transcriptText = '';

  if (data.transcript?.speaker_blocks) {
    transcriptText = data.transcript.speaker_blocks
      .map((block: ReadAISpeakerBlock) => {
        const speaker = block.speaker?.name || 'Unknown';
        return `${speaker}: ${block.words || ''}`;
      })
      .join('\n');
  }

  // Try to link to CRM contacts via participant emails
  let personId: string | null = null;
  let organizationId: string | null = null;

  const allParticipants = data.participants || [];
  const ownerEmail = data.owner?.email;

  for (const participant of allParticipants) {
    if (!participant.email) continue;
    // Skip the meeting owner (internal user)
    if (participant.email === ownerEmail) continue;

    const person = await prisma.person.findUnique({
      where: { email: participant.email },
      select: { id: true, organizationId: true },
    });

    if (person) {
      personId = person.id;
      organizationId = person.organizationId;
      console.log(`✅ Linked to CRM contact: ${participant.email}`);
      break;
    }
  }

  const toJson = (val: unknown): Prisma.InputJsonValue =>
    val == null ? Prisma.DbNull as unknown as Prisma.InputJsonValue : JSON.parse(JSON.stringify(val));

  const jsonFields = {
    transcriptJson: toJson(data.transcript),
    actionItems: toJson(data.action_items),
    keyQuestions: toJson(data.key_questions),
    topics: toJson(data.topics),
    chapterSummaries: toJson(data.chapter_summaries),
    owner: toJson(data.owner),
    participants: toJson(data.participants),
    rawPayload: toJson(data),
  };

  const baseFields = {
    title: data.title || 'Untitled Meeting',
    trigger: data.trigger || null,
    platform: data.platform || null,
    platformMeetingId: data.platform_meeting_id || null,
    startTime: data.start_time ? new Date(data.start_time) : new Date(),
    endTime: data.end_time ? new Date(data.end_time) : null,
    summary: data.summary || null,
    transcript: transcriptText || null,
    reportUrl: data.report_url || null,
    ...jsonFields,
  };

  const meeting = await prisma.readAIMeeting.upsert({
    where: { sessionId: data.session_id },
    update: {
      ...baseFields,
      ...(personId && { personId }),
      ...(organizationId && { organizationId }),
    },
    create: {
      sessionId: data.session_id,
      ...baseFields,
      ...(personId && { personId }),
      ...(organizationId && { organizationId }),
    },
  });

  console.log('✅ Read AI meeting stored:', meeting.id);
  console.log('   Title:', meeting.title);
  console.log('   Participants:', allParticipants.length);
  console.log('   Action items:', data.action_items?.length || 0);
  console.log('   Topics:', data.topics?.length || 0);

  return meeting;
}

/**
 * GET /api/webhooks/read-ai
 *
 * Health check endpoint.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'read-ai-webhook',
    timestamp: new Date().toISOString(),
    note: 'This endpoint receives webhook events from Read AI',
  });
}
