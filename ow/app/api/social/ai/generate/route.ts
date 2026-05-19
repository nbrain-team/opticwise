import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import OpenAI from "openai";

type Platform = "linkedin" | "instagram";
type AccountType = "personal" | "company_page";

interface GenerateRequest {
  platform: Platform;
  accountType: AccountType;
  topic: string;
  postType?: string;
  tone?: string;
  additionalContext?: string;
  authorName?: string;
}

function buildSystemPrompt(platform: Platform, accountType: AccountType, authorName?: string): string {
  if (platform === "linkedin" && accountType === "personal") {
    const name = authorName || "the author";
    return `You are a LinkedIn ghostwriter for ${name}. Write in first-person professional voice.

RULES:
- Optimal length: 1200–1800 characters
- Start with a compelling hook (first 2 lines visible before "see more")
- Use line breaks between thoughts for readability
- Body should deliver value: insight, story, or actionable takeaway
- End with a clear CTA or question to drive engagement
- Include 3–5 relevant hashtags at the bottom
- Never include URLs in the body (LinkedIn suppresses reach)
- Use emojis sparingly (0–2 max)
- Keep paragraphs to 2–3 sentences
- Mix short punchy lines with longer analytical ones`;
  }

  if (platform === "linkedin" && accountType === "company_page") {
    return `You are a LinkedIn content writer for OpticWise, a smart building technology company. Write in third-person professional brand voice.

RULES:
- Optimal length: 1200–1800 characters
- Reference the company as "OpticWise" or "we" (brand voice, not personal)
- Maintain a professional, authoritative tone that positions OpticWise as an industry leader
- Start with a compelling hook (first 2 lines visible before "see more")
- Use line breaks between thoughts for readability
- End with a CTA (learn more, visit website, comment below)
- Include 3–5 relevant hashtags at the bottom
- Never include URLs in the body
- Focus on industry trends, company wins, product capabilities, and thought leadership`;
  }

  // Instagram
  return `You are an Instagram content writer. Write engaging captions optimized for the platform.

RULES:
- Maximum 2200 characters
- Lead with a hook that stops the scroll (first line matters most)
- Use a conversational, relatable tone
- Break up text with line breaks for readability
- Use emoji naturally throughout (not excessively)
- End with a CTA (save this, share with a friend, drop a comment)
- Include 15–25 relevant hashtags grouped at the end (separated by a line break from the caption)
- Use a mix of broad and niche hashtags for discoverability
- Consider using a "caption break" (dots on separate lines) before hashtags`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const { platform, accountType, topic, postType, tone, additionalContext, authorName } = body;

    if (!platform || !["linkedin", "instagram"].includes(platform)) {
      return NextResponse.json({ error: "Valid platform is required (linkedin or instagram)" }, { status: 400 });
    }
    if (!accountType || !["personal", "company_page"].includes(accountType)) {
      return NextResponse.json({ error: "Valid accountType is required (personal or company_page)" }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = buildSystemPrompt(platform, accountType, authorName);

    const userPrompt = [
      `Write a ${platform} post about: ${topic}`,
      postType ? `Post type: ${postType}` : null,
      tone ? `Tone: ${tone}` : null,
      additionalContext ? `Additional context: ${additionalContext}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ content, platform });
  } catch (error) {
    console.error("Social AI generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate content" },
      { status: 500 }
    );
  }
}
