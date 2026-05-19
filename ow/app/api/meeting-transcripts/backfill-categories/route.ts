import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { classifyReadAIMeeting } from "@/lib/meeting-classifier";

/**
 * POST /api/meeting-transcripts/backfill-categories
 *
 * One-time backfill: classifies every ReadAIMeeting that hasn't been
 * categorized yet (categorizedAt IS NULL). Processes sequentially to
 * stay within OpenAI rate limits. Returns a summary of results.
 *
 * Auth: requires a logged-in session.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uncategorized = await prisma.readAIMeeting.findMany({
    where: { categorizedAt: null },
    select: {
      id: true,
      title: true,
      summary: true,
      transcript: true,
      participants: true,
      owner: true,
      topics: true,
      startTime: true,
    },
    orderBy: { startTime: "desc" },
  });

  if (uncategorized.length === 0) {
    return NextResponse.json({ message: "All meetings already categorized", processed: 0 });
  }

  const results: Array<{ id: string; title: string; category: string; confidence: number }> = [];
  const errors: Array<{ id: string; title: string; error: string }> = [];

  for (const meeting of uncategorized) {
    try {
      const participants =
        (meeting.participants as Array<{ name?: string; email?: string | null }> | null) || [];
      const owner = meeting.owner as { name?: string; email?: string } | null;
      const topics = (meeting.topics as Array<{ text: string }> | null) || [];

      const result = await classifyReadAIMeeting({
        title: meeting.title,
        summary: meeting.summary,
        participants,
        ownerEmail: owner?.email || null,
        topics,
        transcriptExcerpt: meeting.transcript ? meeting.transcript.slice(0, 4000) : null,
      });

      await prisma.readAIMeeting.update({
        where: { id: meeting.id },
        data: {
          category: result.category,
          categoryConfidence: result.confidence,
          categoryReason: result.reason,
          categorizedAt: new Date(),
        },
      });

      results.push({
        id: meeting.id,
        title: meeting.title,
        category: result.category,
        confidence: result.confidence,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ id: meeting.id, title: meeting.title, error: message });
    }
  }

  return NextResponse.json({
    processed: results.length,
    errors: errors.length,
    results,
    ...(errors.length > 0 ? { errorDetails: errors } : {}),
  });
}
