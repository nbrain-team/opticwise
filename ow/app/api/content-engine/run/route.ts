/**
 * Content Engine — run endpoint
 *
 * POST /api/content-engine/run
 *
 * Body (one of):
 *   {
 *     "date": "YYYY-MM-DD",
 *     "labelQuery": "label:2day-wd-inbox-2day-wd-read",
 *     "preferredMoat": "data" | "workflows" | "orchestration" | "operating-standard",
 *     "postToDrive": false,
 *     "dryRun": true
 *   }
 *
 * Or with pre-pulled sources (useful for tests / reruns):
 *   {
 *     "date": "YYYY-MM-DD",
 *     "sources": [{ subject, sender, snippet, body, url?, receivedAt }, ...],
 *     "postToDrive": false
 *   }
 *
 * Returns the full result (trends, packages, briefing, summary, drivePayload).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getSession } from '@/lib/session';
import {
  runContentEngine,
  loadGmailSources,
  ContentEngineSource,
  EditorialMoat,
} from '@/lib/content-engine';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function POST(request: NextRequest) {
  try {
    // Allow internal calls (cron / Slack) via the existing internal-key pattern.
    const internalKey = request.headers.get('x-internal-api-key');
    const isInternalCall =
      internalKey && process.env.AUTH_SECRET && internalKey === process.env.AUTH_SECRET;

    if (!isInternalCall) {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      date?: string;
      labelQuery?: string;
      sources?: ContentEngineSource[];
      preferredMoat?: EditorialMoat;
      postToDrive?: boolean;
      dryRun?: boolean;
      maxMessages?: number;
    };

    const date = body.date || new Date().toISOString().slice(0, 10);

    let sources: ContentEngineSource[] = [];
    if (body.sources && body.sources.length) {
      sources = body.sources;
    } else if (body.labelQuery) {
      sources = await loadGmailSources(body.labelQuery, body.maxMessages || 80);
      if (!sources.length) {
        return NextResponse.json(
          { error: `No emails found for label query: ${body.labelQuery}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Must provide either `sources` or `labelQuery`' },
        { status: 400 }
      );
    }

    if (body.dryRun) {
      return NextResponse.json({
        date,
        sourcesLoaded: sources.length,
        sample: sources.slice(0, 3).map((s) => ({
          subject: s.subject,
          sender: s.sender,
          snippet: s.snippet?.slice(0, 200),
        })),
        message: 'Dry run — sources loaded, no generation performed.',
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await runContentEngine(
      {
        date,
        sources,
        preferredMoat: body.preferredMoat,
        postToDrive: !!body.postToDrive,
      },
      { anthropic, openai, db: getPool() }
    );

    return NextResponse.json({
      date: result.date,
      sourcesUsed: sources.length,
      trends: result.trends,
      packages: result.packages,
      briefing: result.briefing,
      summary: result.summary,
      drivePayload: result.drivePayload,
      driveResult: result.driveResult,
    });
  } catch (error) {
    console.error('[ContentEngine] Run error:', error);
    return NextResponse.json(
      { error: 'Content engine run failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
