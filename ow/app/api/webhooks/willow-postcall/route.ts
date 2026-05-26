import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { processWillowCall, WillowCallData } from "@/lib/willow-postcall";

const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;

let _elevenlabs: ElevenLabsClient | null = null;
function getClient() {
  if (!_elevenlabs) {
    _elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  }
  return _elevenlabs;
}

interface TranscriptTurn {
  role: string;
  message: string;
  time_in_call_secs?: number;
  tool_calls?: unknown;
  tool_results?: unknown;
  feedback?: unknown;
  conversation_turn_metrics?: unknown;
}

interface PostCallTranscriptionEvent {
  type: "post_call_transcription";
  event_timestamp: number;
  data: {
    agent_id: string;
    agent_name?: string;
    conversation_id: string;
    status: string;
    transcript: TranscriptTurn[];
    metadata: {
      start_time_unix_secs: number;
      call_duration_secs?: number;
      cost?: number;
      termination_reason?: string;
      phone_number?: {
        from?: string;
        to?: string;
      };
      [key: string]: unknown;
    };
    analysis: {
      evaluation_criteria_results?: Record<string, unknown>;
      data_collection_results?: Record<string, { value: string; rationale?: string }>;
      call_successful?: string;
      transcript_summary?: string;
    };
    conversation_initiation_client_data?: {
      dynamic_variables?: Record<string, string>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

/**
 * POST /api/webhooks/willow-postcall
 *
 * Receives post-call data from ElevenLabs when a Willow voice agent call ends.
 * Auth: HMAC signature in the elevenlabs-signature header.
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[willow-webhook] Received ElevenLabs webhook");

    if (!WEBHOOK_SECRET) {
      console.error("[willow-webhook] ELEVENLABS_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get("elevenlabs-signature");

    if (!signature) {
      console.error("[willow-webhook] Missing elevenlabs-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify HMAC signature via the ElevenLabs SDK
    let event: PostCallTranscriptionEvent;
    try {
      event = (await getClient().webhooks.constructEvent(
        body,
        signature,
        WEBHOOK_SECRET
      )) as unknown as PostCallTranscriptionEvent;
    } catch (err) {
      console.error("[willow-webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Only process transcription webhooks; acknowledge and skip audio/failure
    if (event.type !== "post_call_transcription") {
      console.log(`[willow-webhook] Ignoring event type: ${event.type}`);
      return NextResponse.json({ received: true, skipped: event.type });
    }

    const { data } = event;
    const dcr = data.analysis?.data_collection_results ?? {};

    // Extract caller phone from Twilio metadata or dynamic variables
    const callerPhone =
      data.metadata?.phone_number?.from ??
      data.conversation_initiation_client_data?.dynamic_variables?.caller_phone ??
      null;

    const callData: WillowCallData = {
      conversationId: data.conversation_id,
      agentId: data.agent_id,
      agentName: data.agent_name,
      status: data.status,
      callerPhone: callerPhone ?? undefined,
      callerName: dcr.caller_name?.value,
      callerCompany: dcr.company?.value,
      callerRole: dcr.role?.value,
      callReason: dcr.reason?.value,
      callbackPreference: dcr.callback_preference?.value,
      contactInfo: dcr.contact_info?.value,
      urgency: dcr.urgency?.value,
      transcript: data.transcript,
      transcriptSummary: data.analysis?.transcript_summary,
      callSuccessful: data.analysis?.call_successful,
      startTime: new Date(data.metadata.start_time_unix_secs * 1000),
      duration: data.metadata.call_duration_secs,
      cost: data.metadata.cost,
      terminationReason: data.metadata.termination_reason ?? undefined,
      rawPayload: JSON.parse(body),
    };

    console.log("[willow-webhook] Processing call:", data.conversation_id, "caller:", callData.callerName ?? "unknown");

    const result = await processWillowCall(callData);

    return NextResponse.json({
      received: true,
      conversation_id: data.conversation_id,
      deal_id: result.dealId,
      person_id: result.personId,
    });
  } catch (error) {
    console.error("[willow-webhook] Error processing webhook:", error);

    // Return 200 on internal errors to prevent ElevenLabs from disabling
    // the webhook after 10 consecutive failures
    return NextResponse.json(
      {
        received: true,
        error: "Internal processing error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhooks/willow-postcall
 *
 * Health check endpoint.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "willow-postcall-webhook",
    timestamp: new Date().toISOString(),
    note: "This endpoint receives post-call webhook events from ElevenLabs (Willow voice agent)",
  });
}
