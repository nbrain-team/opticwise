/**
 * lib/social-risk-classifier.ts — Tiered risk assessment for social media posts.
 *
 * Rule-based first pass (fast, no LLM cost). Optional LLM second pass only
 * for edge-case regulatory/legal topics. Output drives the approval queue:
 * low-risk auto-publishes, high-risk goes to /social/pending-approval.
 */

import OpenAI from "openai";

export interface RiskResult {
  tier: "low" | "high";
  reasons: string[];
}

interface ClassifyOptions {
  content: string;
  platform: "linkedin" | "instagram";
  accountType: string; // "personal" | "company_page"
  accountDisplayName?: string;
  useLlmFallback?: boolean;
}

// ─── Competitor names (from battlecard) ──────────────────────

const COMPETITOR_NAMES = [
  "aerwave",
  "realpage",
  "yardi",
  "mri software",
  "mri\\s+software",
  "entrata",
  "appfolio",
  "resman",
  "buildium",
  "rent manager",
  "property meld",
  "vendoroo",
  "happy co",
  "inspectcheck",
  "jobox",
  "latchel",
  "maintainx",
  "optech",
];

const COMPETITOR_REGEX = new RegExp(
  `\\b(${COMPETITOR_NAMES.join("|")})\\b`,
  "i"
);

// ─── Pricing / deal terms / financial figures ────────────────

const FINANCIAL_REGEX =
  /\b(MRR|ARR|contract\s+value|deal\s+size|pricing|per\s*-?\s*unit|per\s*-?\s*door|\$\d{2,}[,.]?\d*[kKmM]?)\b/i;

// ─── Named clients / properties ──────────────────────────────

const CLIENT_INDICATOR_REGEX =
  /\b(our\s+client|a\s+client\s+of\s+ours|at\s+[A-Z][a-z]+\s+(Properties|Management|Capital|Realty|Living|Communities|Residential))\b/;

// ─── Banned words per brand policy ───────────────────────────

const BANNED_WORDS_REGEX =
  /\b(ESG|PropTech|synergy|leverage|cutting[-\s]edge|best[-\s]in[-\s]class|world[-\s]class|turnkey|next[-\s]gen|holistic)\b/i;

// ─── Regulatory / legal topic triggers (LLM second pass) ────

const REGULATORY_REGEX =
  /\b(SEC|FCC|NIST|ASHRAE|GDPR|CCPA|compliance|regulatory|litigation|lawsuit|legal\s+action|intellectual\s+property|patent|NDA)\b/i;

// ─── Rule-based classifier ──────────────────────────────────

function ruleBasedClassify(opts: ClassifyOptions): RiskResult {
  const reasons: string[] = [];
  const { content, accountType } = opts;

  // PPP company page posts default to high-risk
  if (
    accountType === "company_page" &&
    opts.accountDisplayName &&
    /ppp|property\s*partners/i.test(opts.accountDisplayName)
  ) {
    reasons.push("PPP company page post — requires review");
  }

  // Competitor names
  const competitorMatch = content.match(COMPETITOR_REGEX);
  if (competitorMatch) {
    reasons.push(`Mentions competitor: "${competitorMatch[1]}"`);
  }

  // Pricing / deal terms
  if (FINANCIAL_REGEX.test(content)) {
    reasons.push("Contains pricing, deal terms, or financial figures");
  }

  // Named clients or properties
  if (CLIENT_INDICATOR_REGEX.test(content)) {
    reasons.push("References a specific client or property by name");
  }

  // Banned words
  const bannedMatch = content.match(BANNED_WORDS_REGEX);
  if (bannedMatch) {
    reasons.push(`Uses banned word: "${bannedMatch[1]}"`);
  }

  // Over-length
  if (content.length > 1500) {
    reasons.push(`Post is ${content.length} chars (>1500 limit)`);
  }

  return {
    tier: reasons.length > 0 ? "high" : "low",
    reasons,
  };
}

// ─── LLM second pass ────────────────────────────────────────

async function llmRegulatoryCheck(content: string): Promise<string[]> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a compliance reviewer for a B2B technology company's social media posts.
Evaluate whether the following post could create legal, regulatory, or reputational risk.

Check for:
- Claims about regulatory compliance (SEC, FCC, NIST, ASHRAE, GDPR, CCPA) that could be inaccurate
- Statements that could be interpreted as legal advice
- Forward-looking financial statements
- Potential defamation or disparagement
- Confidential information disclosure

Respond with a JSON array of risk reasons. If the post is safe, respond with an empty array: []
Example: ["Contains unverified SEC compliance claim", "Forward-looking revenue statement"]`,
        },
        {
          role: "user",
          content,
        },
      ],
    });

    const text = resp.choices[0]?.message?.content?.trim() || "[]";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Main classifier entry point ────────────────────────────

export async function classifyRisk(opts: ClassifyOptions): Promise<RiskResult> {
  const ruleResult = ruleBasedClassify(opts);

  if (ruleResult.tier === "high") {
    return ruleResult;
  }

  // Only invoke LLM if rule-based says low but regulatory keywords are present
  if (opts.useLlmFallback !== false && REGULATORY_REGEX.test(opts.content)) {
    const llmReasons = await llmRegulatoryCheck(opts.content);
    if (llmReasons.length > 0) {
      return {
        tier: "high",
        reasons: [...ruleResult.reasons, ...llmReasons],
      };
    }
  }

  return ruleResult;
}
