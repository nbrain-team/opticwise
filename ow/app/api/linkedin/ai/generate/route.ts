import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import Anthropic from '@anthropic-ai/sdk';

const LINKEDIN_SYSTEM_PROMPT = `You are a LinkedIn content strategist for Opticwise, a smart building technology company led by Bill Demas. Opticwise specializes in managed network services, smart building infrastructure, and technology solutions for commercial real estate (multifamily, office, hospitality, mixed-use properties).

WRITING STYLE GUIDELINES:
- Write in Bill's voice: authoritative yet approachable, a seasoned industry leader sharing practical insights
- Use short, punchy sentences mixed with longer analytical ones
- Start with a compelling hook in the first 2 lines (these appear before "see more")
- Use line breaks between thoughts for readability
- Include relevant hashtags (3-5 max) at the bottom
- Never include external URLs in the post body (LinkedIn suppresses them 40-50%)
- If a URL is needed, note it should go in the first comment
- Keep posts under 3,000 characters
- Use emojis sparingly and professionally (1-3 max if appropriate)
- Mix personal experience with industry insights
- End with a question or call-to-action to drive engagement

TOPIC AREAS:
- Smart building technology trends
- Managed network services for commercial real estate
- Property technology (PropTech) innovation
- NOI optimization through technology
- Resident/tenant experience and connectivity
- Industry events and conferences
- Leadership and business growth
- Digital infrastructure and IoT in buildings
- Cybersecurity for property networks
- Team culture and company updates

POST TYPES YOU CAN CREATE:
1. Thought Leadership - Share industry insights and opinions
2. Educational - Teach something valuable about smart building tech
3. Story/Narrative - Share a personal experience or case study
4. Industry News Commentary - React to trends or news
5. Company Update - Share wins, milestones, team highlights
6. Engagement - Polls-style questions, hot takes, "unpopular opinions"

FORMATTING RULES:
- First ~210 characters are critical (visible before fold)
- Use whitespace/line breaks liberally
- Bullet points and numbered lists work well
- Bold text is not available on LinkedIn, so use CAPS sparingly for emphasis
- Keep paragraphs to 2-3 sentences max`;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, postType, tone, additionalContext, existingDraft } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const anthropic = new Anthropic();

    let userPrompt = '';
    if (existingDraft) {
      userPrompt = `Improve and refine this LinkedIn post draft. Keep the core message but enhance the writing, hook, structure, and engagement potential:\n\nDRAFT:\n${existingDraft}\n\nAdditional instructions: ${additionalContext || 'Make it more compelling and engaging.'}`;
    } else {
      userPrompt = `Write a LinkedIn post about: ${topic}\n\nPost type: ${postType || 'Thought Leadership'}\nTone: ${tone || 'Professional and insightful'}\n${additionalContext ? `Additional context: ${additionalContext}` : ''}`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: LINKEDIN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      content,
      metadata: {
        topic,
        postType: postType || 'Thought Leadership',
        tone: tone || 'Professional and insightful',
        charCount: content.length,
        estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200),
      },
    });
  } catch (error) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    );
  }
}
