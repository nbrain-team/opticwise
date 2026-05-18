/**
 * Sprint 2 / 4.7 — Generate-from-transcript API.
 *
 * POST /api/meeting-transcripts/[id]/generate
 * Body: { action: string }
 *
 * Generates a category-aware artifact (follow-up email, recap, show notes,
 * social clip, etc.) from a Read.ai meeting transcript using OpenAI. The
 * action set is defined alongside the meeting category — invalid (action,
 * category) pairs return 400 to keep the API surface tight.
 *
 * The route returns generated markdown plus a short title for the artifact.
 * It does NOT persist the artifact today; surfacing in the UI is enough for
 * v1 and persistence is a v2 follow-up once Bill confirms the artifact
 * shape he wants in the CRM (linked to the meeting + deal).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import OpenAI from "openai";
import {
  GENERATE_ACTIONS,
  buildGeneratePrompt,
  type MeetingCategoryValue,
  type GenerateAction,
} from "@/lib/meeting-generate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: { action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const action = body.action;
  if (typeof action !== "string" || action.trim().length === 0) {
    return NextResponse.json({ error: "`action` is required" }, { status: 400 });
  }

  const meeting = await prisma.readAIMeeting.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      summary: true,
      transcript: true,
      participants: true,
      owner: true,
      topics: true,
      actionItems: true,
      keyQuestions: true,
      chapterSummaries: true,
      startTime: true,
      endTime: true,
      category: true,
    },
  });
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const category = (meeting.category || "other") as MeetingCategoryValue;
  const allowed = GENERATE_ACTIONS[category];
  if (!allowed.some((a) => a.id === action)) {
    return NextResponse.json(
      {
        error: `Action '${action}' is not available for category '${category}'. Allowed: ${allowed.map((a) => a.id).join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured on the server" },
      { status: 500 }
    );
  }

  const { system, user, suggestedTitle } = buildGeneratePrompt({
    action: action as GenerateAction,
    category,
    title: meeting.title,
    summary: meeting.summary,
    transcript: meeting.transcript,
    participants:
      (meeting.participants as Array<{ name?: string; email?: string | null }> | null) || [],
    owner: meeting.owner as { name?: string; email?: string } | null,
    topics: (meeting.topics as Array<{ text: string }> | null) || [],
    actionItems: (meeting.actionItems as Array<{ text: string }> | null) || [],
    chapterSummaries:
      (meeting.chapterSummaries as Array<{
        title: string;
        description: string;
      }> | null) || [],
    startTime: meeting.startTime,
  });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_GENERATE_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const content = resp.choices[0]?.message?.content?.trim() || "";
    if (!content) {
      return NextResponse.json(
        { error: "Model returned an empty response. Try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({
      action,
      category,
      title: suggestedTitle,
      content,
      meetingId: meeting.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[meeting/generate] OpenAI error:", message);
    return NextResponse.json(
      { error: `Generation failed: ${message}` },
      { status: 502 }
    );
  }
}
