import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

const FATHOM_WEBHOOK_SECRET = process.env.FATHOM_WEBHOOK_SECRET || 'whsec_Md1/I/ZdFvTDmI/DROEiGAlM6NjP3ffZ';

/**
 * Verify Fathom webhook signature
 * This ensures the webhook is actually from Fathom and hasn't been tampered with
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Fathom uses HMAC-SHA256 for webhook signatures
    // The exact format depends on Fathom's implementation
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * POST /api/webhooks/fathom
 * 
 * Webhook endpoint to receive transcript data from Fathom.ai
 * 
 * Expected payload structure (adjust based on actual Fathom webhook format):
 * {
 *   event: 'call.completed' | 'transcript.ready',
 *   call_id: string,
 *   title: string,
 *   start_time: string,
 *   end_time: string,
 *   duration: number,
 *   participants: Array<{ name: string, email?: string }>,
 *   transcript: string,
 *   summary?: string,
 *   recording_url?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received Fathom webhook');
    
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Verify webhook signature if provided
    const signature = request.headers.get('x-fathom-signature') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('signature');
    
    if (signature && FATHOM_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature, FATHOM_WEBHOOK_SECRET);
      
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️  No signature verification (signature or secret missing)');
    }
    
    // Log the webhook event
    console.log('Webhook event:', body.event || 'unknown');
    console.log('Call ID:', body.call_id || body.id);
    
    // Process different event types
    switch (body.event) {
      case 'call.completed':
      case 'transcript.ready':
        await handleTranscriptReady(body);
        break;
      
      case 'call.started':
        console.log('Call started, no action needed yet');
        break;
      
      default:
        console.log('Unknown event type:', body.event);
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ 
      received: true,
      event: body.event,
      call_id: body.call_id || body.id 
    });
    
  } catch (error) {
    console.error('❌ Error processing Fathom webhook:', error);
    
    // Still return 200 to prevent Fathom from retrying
    // Log the error for investigation
    return NextResponse.json(
      { 
        received: true,
        error: 'Internal processing error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    );
  }
}

/**
 * Handle transcript ready event
 */
async function handleTranscriptReady(data: any) {
  try {
    console.log('📝 Processing transcript for call:', data.call_id || data.id);
    
    const fathomCallId = data.call_id || data.id;
    
    // Convert transcript array to text if it's in structured format
    let transcriptText = '';
    let transcriptJson = null;
    
    if (Array.isArray(data.transcript)) {
      // Structured format with speakers
      transcriptJson = data.transcript;
      transcriptText = data.transcript.map((segment: any) => {
        const speaker = segment.speaker?.display_name || 'Unknown Speaker';
        const timestamp = segment.timestamp || '';
        return `[${timestamp}] ${speaker}: ${segment.text}`;
      }).join('\n');
    } else if (typeof data.transcript === 'string') {
      // Plain text format
      transcriptText = data.transcript;
    }
    
    // Try to find matching person by email from participants
    let personId = null;
    let organizationId = null;
    
    if (Array.isArray(data.participants)) {
      for (const participant of data.participants) {
        const email = participant.email || participant.matched_calendar_invitee_email;
        
        if (email) {
          const person = await db.person.findUnique({
            where: { email },
            select: { id: true, organizationId: true },
          });
          
          if (person) {
            personId = person.id;
            organizationId = person.organizationId;
            console.log(`✅ Linked to person: ${email}`);
            break;
          }
        }
      }
    }
    
    // Store transcript in database
    const transcript = await db.callTranscript.upsert({
      where: { fathomCallId },
      update: {
        title: data.title || 'Untitled Call',
        transcript: transcriptText,
        transcriptJson,
        summary: data.summary,
        startTime: data.start_time ? new Date(data.start_time) : new Date(),
        endTime: data.end_time ? new Date(data.end_time) : null,
        duration: data.duration || 0,
        participants: data.participants || [],
        recordingUrl: data.recording_url,
        personId,
        organizationId,
        metadata: data,
      },
      create: {
        fathomCallId,
        title: data.title || 'Untitled Call',
        transcript: transcriptText,
        transcriptJson,
        summary: data.summary,
        startTime: data.start_time ? new Date(data.start_time) : new Date(),
        endTime: data.end_time ? new Date(data.end_time) : null,
        duration: data.duration || 0,
        participants: data.participants || [],
        recordingUrl: data.recording_url,
        personId,
        organizationId,
        metadata: data,
      },
    });
    
    console.log('✅ Transcript stored successfully:', transcript.id);
    console.log('Transcript length:', transcriptText.length, 'characters');
    console.log('Participants:', data.participants?.length || 0);
    
    // TODO: Advanced auto-linking
    // 1. Parse meeting title for deal/organization names and link
    // 2. Use AI to analyze transcript content for entity mentions
    // 3. Suggest associations to users
    
    return transcript;
    
  } catch (error) {
    console.error('Error storing transcript:', error);
    throw error;
  }
}

/**
 * GET /api/webhooks/fathom
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'fathom-webhook',
    timestamp: new Date().toISOString(),
    note: 'This endpoint receives webhook events from Fathom.ai'
  });
}

