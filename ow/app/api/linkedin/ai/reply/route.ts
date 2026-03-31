import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import Anthropic from '@anthropic-ai/sdk';

const REPLY_SYSTEM_PROMPT = `You are helping Bill Demas from Opticwise reply to LinkedIn comments on his posts. Opticwise is a smart building technology company specializing in managed network services for commercial real estate.

REPLY GUIDELINES:
- Keep replies concise (1-3 sentences typically)
- Be warm, genuine, and professional
- Acknowledge the commenter's point before adding value
- Use their first name if available
- Don't be overly salesy - be authentic
- If they asked a question, answer it directly
- If they shared praise, thank them sincerely
- If they disagreed, be respectful and open-minded
- Offer to connect or continue the conversation when appropriate
- Never use generic responses like "Great point!" alone - always add substance
- Match the energy/tone of the original comment`;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentContent, postContent, authorName, tone } = await req.json();

    if (!commentContent || !postContent) {
      return NextResponse.json(
        { error: 'commentContent and postContent are required' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: REPLY_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Original post:\n${postContent}\n\nComment by ${authorName || 'someone'}:\n${commentContent}\n\n${tone ? `Tone: ${tone}` : ''}\n\nWrite a thoughtful reply:`,
      }],
    });

    const reply = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ reply, authorName });
  } catch (error) {
    console.error('AI reply error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate reply' },
      { status: 500 }
    );
  }
}
