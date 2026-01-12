import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/chatbot - Handle chatbot messages (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversationId,
      visitorId,
      email,
      name,
      company,
      pageUrl,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!message || !visitorId) {
      return NextResponse.json(
        { error: 'Message and visitorId are required' },
        { status: 400 }
      );
    }

    let conversation;

    // Get or create conversation
    if (conversationId) {
      conversation = await prisma.chatbotConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });
    }

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.chatbotConversation.create({
        data: {
          visitorId,
          email,
          name,
          company,
          pageUrl,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          status: 'active',
        },
        include: {
          messages: true,
        },
      });
    }

    // Save user message
    await prisma.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // Get conversation history
    const history = await prisma.chatbotMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { timestamp: 'asc' },
    });

    // Build AI prompt
    const systemPrompt = `You are a helpful sales assistant for OpticWise, a company that provides digital infrastructure solutions for commercial real estate properties (offices, apartments, hotels).

**Your Goal:** Qualify leads and guide them toward booking a free infrastructure audit consultation.

**Key Qualification Questions:**
1. What type of property do you manage? (office, apartment, hospitality)
2. How many units or square feet?
3. What are your current pain points with building systems?
4. Are you the decision maker for infrastructure decisions?

**OpticWise Value Propositions:**
- 10%+ utility savings through system consolidation
- $6-12 per door in additional recurring revenue (internet, cable, smart home services)
- Single unified digital infrastructure vs. fragmented vendor systems
- Typical contract: 5-10 years, $2.5K-$15K/month recurring revenue

**Your Approach:**
1. Answer questions about OpticWise naturally and helpfully
2. Gradually guide conversation toward qualification
3. When you have 3-4 key data points, offer the free audit
4. Be conversational, not pushy
5. Focus on their pain points and how OpticWise solves them

**Conversation Guidelines:**
- Keep responses concise (2-3 paragraphs max)
- Ask one question at a time
- Show genuine interest in their challenges
- Use specific examples relevant to their property type
- When appropriate, mention the free 1-hour infrastructure audit

**Current Conversation Status:**
- Lead Score: ${conversation.leadScore}/100
- Qualified: ${conversation.isQualified ? 'Yes' : 'Not yet'}
- Email Captured: ${conversation.email ? 'Yes' : 'No'}

If the lead score is above 40 and you have their email, offer to book the free audit consultation.`;

    // Build message history for Claude
    const messages: Anthropic.MessageParam[] = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save assistant message
    await prisma.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
      },
    });

    // Update lead score based on conversation
    const updatedScore = calculateLeadScore(history, message);
    const isQualified = updatedScore >= 40 && !!conversation.email;

    await prisma.chatbotConversation.update({
      where: { id: conversation.id },
      data: {
        leadScore: updatedScore,
        isQualified,
        ...(isQualified && !conversation.qualifiedAt && { qualifiedAt: new Date() }),
        ...(email && !conversation.email && { email }),
        ...(name && !conversation.name && { name }),
        ...(company && !conversation.company && { company }),
      },
    });

    // Check if we should offer audit booking
    const shouldOfferAudit = updatedScore >= 40 && conversation.email;

    return NextResponse.json({
      message: assistantMessage,
      conversationId: conversation.id,
      leadScore: updatedScore,
      isQualified,
      shouldOfferAudit,
      ...(shouldOfferAudit && {
        auditBookingUrl: process.env.CALENDLY_LINK || 'https://calendly.com/opticwise/consultation',
      }),
    });
  } catch (error) {
    console.error('Error in chatbot:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Helper function to calculate lead score
function calculateLeadScore(history: { content: string }[], latestMessage: string): number {
  let score = 0;

  const conversationText = history.map(m => m.content).join(' ').toLowerCase();
  const latest = latestMessage.toLowerCase();

  // Property type mentioned
  if (conversationText.includes('apartment') || conversationText.includes('office') || conversationText.includes('hotel')) {
    score += 15;
  }

  // Size/scale indicators
  if (conversationText.match(/\d+\s*(units|doors|square feet|sf)/i)) {
    score += 15;
  }

  // Pain points mentioned
  const painKeywords = ['problem', 'issue', 'challenge', 'difficult', 'expensive', 'cost', 'vendor', 'system'];
  const painMentions = painKeywords.filter(keyword => conversationText.includes(keyword)).length;
  score += Math.min(painMentions * 5, 20);

  // Decision maker indicators
  if (conversationText.includes('i manage') || conversationText.includes('i own') || conversationText.includes('my property')) {
    score += 20;
  }

  // Engagement (longer messages = more engaged)
  if (latest.length > 100) score += 10;
  else if (latest.length > 50) score += 5;

  // Number of messages (engagement)
  score += Math.min(history.length * 2, 20);

  return Math.min(score, 100);
}

// GET /api/chatbot - Get conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const visitorId = searchParams.get('visitorId');

    if (!conversationId && !visitorId) {
      return NextResponse.json(
        { error: 'conversationId or visitorId required' },
        { status: 400 }
      );
    }

    const where: { id?: string; visitorId?: string } = {};
    if (conversationId) where.id = conversationId;
    else if (visitorId) where.visitorId = visitorId;

    const conversation = await prisma.chatbotConversation.findFirst({
      where,
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ conversation: null });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

