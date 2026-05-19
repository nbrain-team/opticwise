/**
 * scripts/backfill-meeting-categories.ts
 *
 * One-time backfill: classifies every ReadAIMeeting where categorizedAt IS NULL.
 * Processes sequentially with a small delay to stay within OpenAI rate limits.
 *
 * Run from Render shell:
 *   npx tsx scripts/backfill-meeting-categories.ts
 *
 * Requires DATABASE_URL and OPENAI_API_KEY in the environment.
 */

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

const VALID_CATEGORIES = [
  "sales",
  "client",
  "internal",
  "vendor",
  "executives",
  "ppp_podcast",
  "other",
] as const;
type Cat = (typeof VALID_CATEGORIES)[number];

const OW_DOMAINS = ["opticwise.com", "nbrain.ai"];

function isAllInternal(
  participants: Array<{ name?: string; email?: string | null }>
): boolean {
  let hasExternal = false;
  for (const p of participants) {
    const email = (p.email || "").toLowerCase();
    if (!email) continue;
    const domain = email.split("@")[1];
    if (!domain) continue;
    if (!OW_DOMAINS.includes(domain)) {
      hasExternal = true;
      break;
    }
  }
  return !hasExternal;
}

function buildSystemPrompt(): string {
  return [
    "You are a meeting classifier for OpticWise (OW). Decide which ONE of seven categories best describes the meeting:",
    "",
    "- sales — prospecting/discovery/demo/proposal/pricing calls with POTENTIAL customers.",
    "- client — calls with EXISTING paying OW customers: onboarding, QBR, renewal, support.",
    "- internal — OW team-only meetings (standup, planning, retro, all-hands, 1:1).",
    "- vendor — calls with suppliers, contractors, agencies, IT/OT integrators we BUY from.",
    "- executives — board, investor, advisor, exec coaching, strategic partnership at C-level, M&A.",
    "- ppp_podcast — Peak Property Performance (PPP) podcast recordings or prep.",
    "- other — fits none of the above or too thin to classify.",
    "",
    "OW internal domains: opticwise.com, nbrain.ai.",
    "Return STRICT JSON: { \"category\": \"<one of seven>\", \"confidence\": <0..1>, \"reason\": \"<≤120 chars>\" }",
  ].join("\n");
}

async function classify(
  openai: OpenAI,
  meeting: {
    title: string;
    summary: string | null;
    transcript: string | null;
    participants: unknown;
    owner: unknown;
    topics: unknown;
  }
): Promise<{ category: Cat; confidence: number; reason: string }> {
  const participants =
    (meeting.participants as Array<{ name?: string; email?: string | null }>) || [];
  const owner = meeting.owner as { name?: string; email?: string } | null;
  const topics = (meeting.topics as Array<{ text: string }>) || [];

  if (!meeting.summary && !meeting.transcript && !meeting.title.trim()) {
    return { category: "other", confidence: 0, reason: "Empty title, summary, and transcript." };
  }

  if (!meeting.summary && !meeting.transcript) {
    if (isAllInternal(participants) && participants.length > 0) {
      return {
        category: "internal",
        confidence: 0.65,
        reason: "All participants on OW internal domains; no transcript to classify further.",
      };
    }
    return { category: "other", confidence: 0, reason: "No summary or transcript available." };
  }

  const parts = participants
    .slice(0, 20)
    .map((p) => `- ${p.name || "Unknown"} <${p.email || "no-email"}>`)
    .join("\n");
  const topicLines = topics
    .slice(0, 15)
    .map((t) => `- ${t.text}`)
    .join("\n");
  const summarySection = meeting.summary
    ? `\nSummary:\n${meeting.summary.slice(0, 2000)}`
    : "";
  const excerptSection = meeting.transcript
    ? `\nTranscript excerpt:\n${meeting.transcript.slice(0, 4000)}`
    : "";

  const userPrompt = [
    `Meeting title: ${meeting.title}`,
    owner?.email ? `Meeting owner: ${owner.email}` : "",
    "",
    "Participants:",
    parts || "(none captured)",
    topicLines ? `\nTopics:\n${topicLines}` : "",
    summarySection,
    excerptSection,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_CLASSIFIER_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      max_tokens: 200,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userPrompt },
      ],
    });

    const content = resp.choices[0]?.message?.content?.trim() || "";
    if (!content) {
      return { category: "other", confidence: 0, reason: "Classifier returned empty." };
    }
    const parsed = JSON.parse(content);
    const category =
      parsed.category && VALID_CATEGORIES.includes(parsed.category)
        ? (parsed.category as Cat)
        : "other";
    const confidence =
      typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0;
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim().slice(0, 240)
        : "No reason provided.";
    return { category, confidence, reason };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("  ⚠ classifier error:", msg);
    return { category: "other", confidence: 0, reason: `Error: ${msg.slice(0, 180)}` };
  }
}

async function main() {
  console.log("\n📋 BACKFILL MEETING CATEGORIES");
  console.log("=".repeat(60));

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set — aborting.");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  console.log(`\nFound ${uncategorized.length} uncategorized meetings.\n`);

  if (uncategorized.length === 0) {
    console.log("✅ All meetings already categorized — nothing to do.");
    await prisma.$disconnect();
    return;
  }

  const stats: Record<string, number> = {};
  let errors = 0;

  for (let i = 0; i < uncategorized.length; i++) {
    const m = uncategorized[i];
    const progress = `[${i + 1}/${uncategorized.length}]`;
    process.stdout.write(
      `${progress} "${m.title.slice(0, 60)}" ... `
    );

    try {
      const result = await classify(openai, m);

      await prisma.readAIMeeting.update({
        where: { id: m.id },
        data: {
          category: result.category,
          categoryConfidence: result.confidence,
          categoryReason: result.reason,
          categorizedAt: new Date(),
        },
      });

      stats[result.category] = (stats[result.category] || 0) + 1;
      console.log(`→ ${result.category} (${Math.round(result.confidence * 100)}%)`);
    } catch (err) {
      errors++;
      console.log(`→ ❌ ${err instanceof Error ? err.message : err}`);
    }

    // Small delay to respect OpenAI rate limits
    if (i < uncategorized.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Results:");
  for (const [cat, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(15)} ${count}`);
  }
  if (errors > 0) console.log(`  errors         ${errors}`);
  console.log(`  total          ${uncategorized.length}`);
  console.log("\n✅ Backfill complete.\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
