/**
 * Sprint 2 / 4.7 — Read.ai meeting category classifier.
 *
 * Classifies a Read.ai meeting into one of the seven canonical categories
 * agreed in the v1 punch list (Bill, 2026-05-11):
 *
 *   sales       — prospecting/discovery/proposal calls with potential
 *                 customers (incl. SDR follow-ups, demos, pricing calls).
 *   client      — calls with EXISTING paying customers (renewal,
 *                 onboarding, support escalation, QBRs, account reviews).
 *   internal    — OW team meetings: standups, planning, retros, all-hands.
 *   vendor      — calls with suppliers/partners we BUY from (tools, infra,
 *                 contractors, agencies, IT/OT integrators).
 *   executives  — board, investor, advisor, leadership-coaching, M&A,
 *                 strategic-partnership-at-exec-level meetings.
 *   ppp_podcast — recordings of the Peak Property Performance (PPP)
 *                 podcast or pre/post-podcast prep with guests.
 *   other       — fits none of the above, or transcript is too thin to
 *                 classify confidently.
 *
 * The classifier is deliberately lightweight: it uses a single OpenAI
 * chat-completions call with a tightly-scoped prompt and JSON-mode output.
 * If the call fails (network, quota, invalid JSON) we fall back to
 * `other` with confidence 0 and a `reason` that records the failure, so
 * the agent UI can surface the issue and Bill can re-classify manually.
 */

import OpenAI from "openai";

const VALID_CATEGORIES = [
  "sales",
  "client",
  "internal",
  "vendor",
  "executives",
  "ppp_podcast",
  "other",
] as const;

export type MeetingCategoryValue = (typeof VALID_CATEGORIES)[number];

export type ClassifierResult = {
  category: MeetingCategoryValue;
  confidence: number; // 0..1
  reason: string;
};

const OW_INTERNAL_DOMAINS = ["opticwise.com", "nbrain.ai"];

export type ClassifierInput = {
  title: string;
  summary: string | null;
  participants: Array<{ name?: string; email?: string | null }>;
  ownerEmail?: string | null;
  topics: Array<{ text: string }> | null;
  /**
   * Optional short excerpt from the transcript when summary is missing —
   * keep it small (≤ 4000 chars) to stay well within the model's
   * context budget and to keep latency low. The webhook handler passes
   * the first slice of the transcript to give the classifier a signal.
   */
  transcriptExcerpt?: string | null;
};

function isAllInternal(
  participants: ClassifierInput["participants"]
): { allInternal: boolean; externalCount: number } {
  let externalCount = 0;
  for (const p of participants) {
    const email = (p.email || "").toLowerCase();
    if (!email) continue;
    const domain = email.split("@")[1];
    if (!domain) continue;
    if (!OW_INTERNAL_DOMAINS.includes(domain)) externalCount++;
  }
  return { allInternal: externalCount === 0, externalCount };
}

function buildSystemPrompt(): string {
  return [
    "You are a meeting classifier for OpticWise (OW). You read meeting metadata and decide which ONE of seven categories best describes the meeting:",
    "",
    "- sales         — prospecting / discovery / demo / proposal / pricing calls with POTENTIAL customers (people who are not yet paying OW customers).",
    "- client        — calls with EXISTING paying OW customers: onboarding, QBR, renewal, account review, support escalation.",
    "- internal      — OW team meetings between OW employees only (standup, planning, retro, all-hands, 1:1).",
    "- vendor        — calls with suppliers, contractors, agencies, infra/tool providers, IT/OT integrators we BUY from.",
    "- executives    — board meetings, investor calls, advisor sessions, exec coaching, strategic partnership at C-level, M&A.",
    "- ppp_podcast   — Peak Property Performance (PPP) podcast recordings or pre/post-podcast prep with guests.",
    "- other         — fits none of the above OR the meeting body is too thin to classify confidently.",
    "",
    "OW internal domains (use to detect internal-only meetings): opticwise.com, nbrain.ai.",
    "",
    "Be conservative: if you're not sure, return 'other' with a low confidence and explain why.",
    "Return STRICT JSON with this exact shape (no markdown, no commentary):",
    '{ "category": "<one of the seven>", "confidence": <0..1 float>, "reason": "<one-sentence justification, ≤120 chars>" }',
  ].join("\n");
}

function buildUserPrompt(input: ClassifierInput): string {
  const parts = input.participants
    .slice(0, 20)
    .map((p) => `- ${p.name || "Unknown"} <${p.email || "no-email"}>`)
    .join("\n");
  const topics = (input.topics || [])
    .slice(0, 15)
    .map((t) => `- ${t.text}`)
    .join("\n");
  const summarySection = input.summary
    ? `\nSummary:\n${input.summary.slice(0, 2000)}`
    : "";
  const excerptSection = input.transcriptExcerpt
    ? `\nTranscript excerpt (first portion):\n${input.transcriptExcerpt.slice(0, 4000)}`
    : "";
  return [
    `Meeting title: ${input.title}`,
    input.ownerEmail ? `Meeting owner: ${input.ownerEmail}` : "",
    "",
    "Participants:",
    parts || "(no participants captured)",
    topics ? `\nTopics:\n${topics}` : "",
    summarySection,
    excerptSection,
  ]
    .filter((s) => s.length > 0)
    .join("\n");
}

function deterministicFallback(input: ClassifierInput): ClassifierResult {
  // No transcript / summary at all → "other" with a clear reason. Avoid
  // calling the model for meetings we can't usefully classify.
  if (!input.summary && !input.transcriptExcerpt) {
    return {
      category: "other",
      confidence: 0,
      reason: "No summary or transcript content available to classify.",
    };
  }
  // All-internal heuristic — useful before/without a model call: if the
  // entire participant list is on OW-internal domains, this is almost
  // certainly an internal meeting. The model can still override with
  // higher confidence (e.g., if title says "Board" — exec).
  const { allInternal } = isAllInternal(input.participants);
  if (allInternal && input.participants.length > 0) {
    return {
      category: "internal",
      confidence: 0.65,
      reason: "All listed participants are on OpticWise/nBrain internal email domains.",
    };
  }
  return { category: "other", confidence: 0, reason: "Pending model classification." };
}

export async function classifyReadAIMeeting(
  input: ClassifierInput
): Promise<ClassifierResult> {
  if (!process.env.OPENAI_API_KEY) {
    return deterministicFallback(input);
  }

  // Cheap pre-check — skip the model when there's nothing to work with.
  if (!input.summary && !input.transcriptExcerpt && !input.title.trim()) {
    return {
      category: "other",
      confidence: 0,
      reason: "Empty title, summary, and transcript — nothing to classify.",
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const sys = buildSystemPrompt();
  const user = buildUserPrompt(input);

  try {
    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_CLASSIFIER_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      max_tokens: 200,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const content = resp.choices[0]?.message?.content?.trim() || "";
    if (!content) {
      return {
        category: "other",
        confidence: 0,
        reason: "Classifier returned empty response.",
      };
    }
    const parsed = JSON.parse(content) as {
      category?: string;
      confidence?: number;
      reason?: string;
    };
    const category =
      parsed.category && VALID_CATEGORIES.includes(parsed.category as MeetingCategoryValue)
        ? (parsed.category as MeetingCategoryValue)
        : "other";
    const confidence =
      typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0;
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim().length > 0
        ? parsed.reason.trim().slice(0, 240)
        : "No reason provided by classifier.";
    return { category, confidence, reason };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[classifyReadAIMeeting] Classifier error:", message);
    return {
      category: "other",
      confidence: 0,
      reason: `Classifier error: ${message.slice(0, 180)}`,
    };
  }
}
