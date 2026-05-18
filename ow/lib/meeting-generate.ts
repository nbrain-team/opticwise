/**
 * Sprint 2 / 4.7 — Generate-from-transcript prompt library.
 *
 * Defines the menu of "generate" actions available per meeting category,
 * plus the prompt-construction helpers used by the API route to produce
 * each artifact. Keep the action list short and high-value — the UI shows
 * every action as a button, so 3–4 per category is the sweet spot.
 *
 * Each artifact respects OW's voice rules from Cursor rules:
 *   - Bill (Bill Douglas) → load `bill-drew-digital-twin-voice` (BILL OS)
 *   - Drew (Drew Hall)   → load that same rule (DREW OS)
 *   - Mixed audiences    → neutral OW brand voice
 * The system prompts ask the model to default to a neutral OW voice
 * unless the caller can identify a specific twin (Phase 2 enhancement —
 * we'll add a per-action `voice` selector when Bill's UI requirements
 * are firm).
 */

export type MeetingCategoryValue =
  | "sales"
  | "client"
  | "internal"
  | "vendor"
  | "executives"
  | "ppp_podcast"
  | "other";

export type GenerateAction = string;

export type ActionDescriptor = {
  id: string;
  label: string;
  /** One-line hint shown under the button in the UI. */
  hint: string;
};

export const GENERATE_ACTIONS: Record<MeetingCategoryValue, ActionDescriptor[]> = {
  sales: [
    {
      id: "follow_up_email",
      label: "Draft follow-up email",
      hint: "Thank-you + recap + suggested next step, ready to send.",
    },
    {
      id: "objections_briefing",
      label: "Extract objections + replies",
      hint: "List every objection raised and a confident 2–3 sentence reply.",
    },
    {
      id: "deal_recap_for_crm",
      label: "Draft CRM deal notes",
      hint: "Short structured note: pain, fit, next step, decision-maker.",
    },
    {
      id: "discovery_question_bank",
      label: "Discovery gaps",
      hint: "Questions we should have asked but didn't.",
    },
  ],
  client: [
    {
      id: "client_recap_email",
      label: "Draft recap email",
      hint: "Recap + decisions + commitments + dates, in OW voice.",
    },
    {
      id: "action_items_owner",
      label: "Action items by owner",
      hint: "Group every action item by who owns it; flag any owner-less ones.",
    },
    {
      id: "renewal_qbr_brief",
      label: "QBR / renewal brief",
      hint: "Health summary + risks + upsell opportunities.",
    },
  ],
  internal: [
    {
      id: "team_minutes",
      label: "Meeting minutes",
      hint: "Concise minutes with decisions, action items, and open questions.",
    },
    {
      id: "action_items_owner",
      label: "Action items by owner",
      hint: "Group every action item by who owns it; flag any owner-less ones.",
    },
    {
      id: "all_hands_summary",
      label: "All-hands summary",
      hint: "1-paragraph plain-English summary you'd post in the team Slack.",
    },
  ],
  vendor: [
    {
      id: "vendor_followup_email",
      label: "Vendor follow-up email",
      hint: "Recap of asks, deliverables, and dates we agreed on.",
    },
    {
      id: "vendor_decision_brief",
      label: "Decision brief",
      hint: "Decisions, deliverables, owners, dates, risks — ready for the CRM.",
    },
  ],
  executives: [
    {
      id: "board_minutes",
      label: "Board-style minutes",
      hint: "Formal minutes with decisions, dissenting views, and follow-ups.",
    },
    {
      id: "exec_action_brief",
      label: "Exec action brief",
      hint: "Decisions + commitments + dates, no fluff, suitable to forward.",
    },
    {
      id: "investor_update_snippet",
      label: "Investor-update snippet",
      hint: "One paragraph suitable to paste into the next investor update.",
    },
  ],
  ppp_podcast: [
    {
      id: "show_notes",
      label: "Show notes",
      hint: "Episode show notes: intro, timestamps, guest bio, key takeaways.",
    },
    {
      id: "social_clips",
      label: "Social clip ideas",
      hint: "5–8 short standalone moments suitable for LinkedIn / X / Reels.",
    },
    {
      id: "linkedin_promo_post",
      label: "LinkedIn promo post",
      hint: "Promo post for the episode in PPP/Bill voice (300–500 chars).",
    },
    {
      id: "guest_thankyou_email",
      label: "Guest thank-you",
      hint: "Short thank-you email to the guest with the episode link slot.",
    },
  ],
  other: [
    {
      id: "general_summary",
      label: "General summary",
      hint: "Plain-English summary + decisions + action items.",
    },
    {
      id: "action_items_owner",
      label: "Action items by owner",
      hint: "Group every action item by who owns it; flag any owner-less ones.",
    },
  ],
};

export type BuildPromptArgs = {
  action: GenerateAction;
  category: MeetingCategoryValue;
  title: string;
  summary: string | null;
  transcript: string | null;
  participants: Array<{ name?: string; email?: string | null }>;
  owner: { name?: string; email?: string } | null;
  topics: Array<{ text: string }>;
  actionItems: Array<{ text: string }>;
  chapterSummaries: Array<{ title: string; description: string }>;
  startTime: Date;
};

const ACTION_INSTRUCTIONS: Record<string, { title: string; body: string }> = {
  // sales
  follow_up_email: {
    title: "Follow-up email draft",
    body:
      "Draft a follow-up email to the EXTERNAL participant(s). Include: a sincere thank-you for their time, a 2–3 bullet recap of what they care about (in their words), a clear suggested next step with a specific date or timeframe, and a friendly close. Keep it under 180 words. Output ONLY the email body — no subject line on its own line, no signature block.",
  },
  objections_briefing: {
    title: "Objections + replies briefing",
    body:
      "List every objection or concern the prospect raised, each followed by a confident 2–3 sentence reply that an OW seller could deliver verbatim. Use a markdown list, format: '**Objection:** ...\\n**Reply:** ...' separated by a blank line.",
  },
  deal_recap_for_crm: {
    title: "CRM deal notes",
    body:
      "Produce a structured deal note suitable for pasting into a CRM activity. Use these sections (markdown headers): ## Pain points, ## Fit indicators, ## Decision-maker(s), ## Next step, ## Risks. Be terse — bullets, not paragraphs.",
  },
  discovery_question_bank: {
    title: "Discovery gaps",
    body:
      "List 5–10 discovery questions we should have asked on this call but didn't (or got incomplete answers to). Group them by area (Budget / Authority / Need / Timing) when possible. Markdown bullet list.",
  },
  // client
  client_recap_email: {
    title: "Client recap email",
    body:
      "Draft a recap email to send to the client. Include: thanks, a recap of decisions and commitments (with dates if mentioned), what OW will do next, what we need from them, and a friendly close. Keep it under 220 words. Output only the email body.",
  },
  // internal + cross-category
  action_items_owner: {
    title: "Action items by owner",
    body:
      "Extract every action item from the transcript and group them by the OWNER (the person responsible). Use a markdown subsection per owner. For action items with no clear owner, list under '## Unassigned'. Each item should be one short imperative sentence.",
  },
  // client
  renewal_qbr_brief: {
    title: "QBR / renewal brief",
    body:
      "Produce a quarterly business review brief suitable for the OW account-management team. Sections (markdown headers): ## Health summary (Red/Yellow/Green + 1 sentence why), ## Wins this quarter, ## Open issues / risks, ## Upsell or expansion opportunities, ## Recommended next step.",
  },
  // internal
  team_minutes: {
    title: "Meeting minutes",
    body:
      "Write concise meeting minutes. Sections (markdown headers): ## Attendees, ## Decisions, ## Action items, ## Open questions. Bullets only — no narrative paragraphs.",
  },
  all_hands_summary: {
    title: "All-hands summary",
    body:
      "Write a single paragraph (60–100 words) summarizing the meeting in a plain, casual tone — like you'd post it in #general so the team who missed it can catch up in 30 seconds.",
  },
  // vendor
  vendor_followup_email: {
    title: "Vendor follow-up email",
    body:
      "Draft a follow-up email to the vendor. Include: recap of what they're delivering, dates they committed to, what OW is providing on its end, and any open questions. Keep it under 180 words. Output only the email body.",
  },
  vendor_decision_brief: {
    title: "Vendor decision brief",
    body:
      "Produce a decision brief. Sections (markdown headers): ## Decisions, ## Deliverables (with owner and date), ## Risks, ## Next checkpoint. Bullets.",
  },
  // executives
  board_minutes: {
    title: "Board-style minutes",
    body:
      "Write formal board-style minutes. Sections (markdown headers): ## Attendees, ## Motions / decisions, ## Dissenting views (if any), ## Action items with owners + dates, ## Next meeting. Keep tone formal but readable.",
  },
  exec_action_brief: {
    title: "Exec action brief",
    body:
      "Write a tight executive briefing suitable to forward. Sections (markdown headers): ## Decisions, ## Commitments (with owner + date), ## Open questions. No filler.",
  },
  investor_update_snippet: {
    title: "Investor-update snippet",
    body:
      "Write one paragraph (80–120 words) suitable to paste into the next investor update — neutral, factual, focused on outcomes. Avoid hype.",
  },
  // ppp_podcast
  show_notes: {
    title: "Episode show notes",
    body:
      "Write podcast show notes for the episode. Sections (markdown headers): ## Episode summary (1 paragraph), ## Guest bio (1 paragraph if a guest is identifiable), ## Key takeaways (5–7 bullets), ## Notable quotes (2–3, attributed). Tone: Peak Property Performance — confident, owner-first, practical.",
  },
  social_clips: {
    title: "Social clip ideas",
    body:
      "Identify 5–8 short standalone moments suitable for 30–90 second social clips. For each: a working clip title (max 8 words), a 1-sentence hook, and the rough timestamp range if discernible. Format as markdown list.",
  },
  linkedin_promo_post: {
    title: "LinkedIn promo post",
    body:
      "Draft a single LinkedIn post promoting the episode in the Peak Property Performance / Bill Douglas voice (confident, owner-first, anti-vendor-capture). 300–500 characters. End with a single call-to-action line.",
  },
  guest_thankyou_email: {
    title: "Guest thank-you email",
    body:
      "Draft a short, warm thank-you email to the podcast guest. Include: appreciation for their time, one specific thing they said that resonated, and a note about when the episode will go live (use a placeholder like [EPISODE_LINK] for the URL). Under 150 words. Output only the email body.",
  },
  // other
  general_summary: {
    title: "General summary",
    body:
      "Write a plain-English summary of the meeting. Sections (markdown headers): ## Summary (1 paragraph), ## Decisions, ## Action items, ## Open questions. Bullets where applicable.",
  },
};

export function buildGeneratePrompt(args: BuildPromptArgs): {
  system: string;
  user: string;
  suggestedTitle: string;
} {
  const instr = ACTION_INSTRUCTIONS[args.action] || ACTION_INSTRUCTIONS.general_summary;

  const system = [
    "You are an assistant inside OWnet — the internal platform for OpticWise (OW). You generate artifacts from Read.ai meeting transcripts.",
    "",
    "Voice rules:",
    "- Default to a neutral OpticWise (OW) brand voice: confident, practical, owner-first, anti-vendor-capture.",
    "- If a Peak Property Performance / PPP podcast artifact is requested, lean toward PPP's voice — owner-first, plain-spoken, technical when warranted.",
    "- Never invent facts, names, decisions, dates, or commitments that aren't in the transcript or metadata.",
    "- If the transcript is too thin to fulfill the request, say so in one sentence and stop.",
    "",
    "Output rules:",
    "- Markdown only. No code fences, no meta-commentary, no preface like 'Here is the...'.",
    "- Be concise; the user will edit before sending.",
    "",
    `Action: ${instr.title}.`,
    `Instructions: ${instr.body}`,
  ].join("\n");

  const participantsBlock = args.participants
    .slice(0, 20)
    .map((p) => `- ${p.name || "Unknown"} <${p.email || "no-email"}>`)
    .join("\n");
  const topicsBlock = args.topics
    .slice(0, 20)
    .map((t) => `- ${t.text}`)
    .join("\n");
  const actionItemsBlock = args.actionItems
    .slice(0, 30)
    .map((a) => `- ${a.text}`)
    .join("\n");
  const chaptersBlock = args.chapterSummaries
    .slice(0, 20)
    .map((c) => `- **${c.title}** — ${c.description}`)
    .join("\n");

  // Cap the raw transcript to keep us inside the model's context window
  // (gpt-4o-mini has 128k tokens, but artifacts shouldn't need more than
  // 15–20k chars of transcript context).
  const transcriptCap = 18000;
  const transcript =
    args.transcript && args.transcript.length > transcriptCap
      ? args.transcript.slice(0, transcriptCap) + "\n…[transcript truncated]"
      : args.transcript;

  const user = [
    `# Meeting: ${args.title}`,
    `Date: ${args.startTime.toISOString()}`,
    `Category: ${args.category}`,
    args.owner ? `Owner: ${args.owner.name || ""} <${args.owner.email || ""}>` : "",
    "",
    "## Participants",
    participantsBlock || "(none captured)",
    topicsBlock ? `\n## Topics\n${topicsBlock}` : "",
    chaptersBlock ? `\n## Chapter summaries\n${chaptersBlock}` : "",
    actionItemsBlock ? `\n## Action items captured by Read.ai\n${actionItemsBlock}` : "",
    args.summary ? `\n## Meeting summary\n${args.summary}` : "",
    transcript ? `\n## Transcript\n${transcript}` : "",
  ]
    .filter((s) => s.length > 0)
    .join("\n");

  return {
    system,
    user,
    suggestedTitle: `${instr.title} — ${args.title}`,
  };
}
