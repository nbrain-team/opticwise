/**
 * Email Voice Analyzer
 * 
 * Analyzes actual sent emails to extract authentic email writing patterns.
 * Dynamically generates style guide based on real communication.
 * 
 * Based on Newbury Partners architecture.
 */

import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

interface EmailVoicePatterns {
  common_openings: string[];
  common_closings: string[];
  signature_patterns: string[];
  avg_email_length: number;
  formality_level: string;
  uses_exclamations: boolean;
  typical_greeting_style: string;
  typical_closing_style: string;
  common_transitions: string[];
  question_asking_style: string;
  call_to_action_style: string;
  paragraph_length: string;
  uses_bullet_points: boolean;
  tone_characteristics: string[];
  common_phrases: string[];
}

interface EmailVoiceAnalysis {
  analyzed_at: string;
  email_count: number;
  patterns: EmailVoicePatterns;
  sample_emails: Array<{
    subject: string;
    opening: string;
    closing: string;
    length: number;
  }>;
}

export class EmailVoiceAnalyzer {
  private dbPool: Pool;
  private anthropic: Anthropic;
  private cache: Map<string, { data: EmailVoiceAnalysis; timestamp: number }>;
  private CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(dbPool: Pool, anthropic: Anthropic) {
    this.dbPool = dbPool;
    this.anthropic = anthropic;
    this.cache = new Map();
  }

  async generateEmailStyleGuide(userId?: string): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `email_voice_${userId || 'default'}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('[EmailVoiceAnalyzer] Using cached analysis');
        return this.formatEmailStyleGuide(cached.data);
      }

      // Analyze sent emails
      const emailVoice = await this.analyzeEmailVoice();

      // Cache results
      this.cache.set(cacheKey, {
        data: emailVoice,
        timestamp: Date.now(),
      });

      return this.formatEmailStyleGuide(emailVoice);
    } catch (error) {
      console.error('[EmailVoiceAnalyzer] Error:', error);
      return this.getDefaultEmailVoice();
    }
  }

  private async analyzeEmailVoice(): Promise<EmailVoiceAnalysis> {
    // Get sent emails from OpticWise team
    const query = `
      SELECT 
        subject, 
        body,
        "from" as sender_email,
        date as sent_at
      FROM "GmailMessage"
      WHERE (
        "from" ILIKE '%opticwise%' 
        OR "from" ILIKE '%bill%douglas%'
        OR "from" ILIKE '%drew%hall%'
      )
        AND body IS NOT NULL
        AND LENGTH(body) > 50
        AND date > NOW() - INTERVAL '12 months'
      ORDER BY date DESC 
      LIMIT 500
    `;

    const result = await this.dbPool.query(query);
    const emails = result.rows;

    console.log(`[EmailVoiceAnalyzer] Found ${emails.length} sent emails to analyze`);

    if (emails.length === 0) {
      return this.getDefaultEmailVoiceAnalysis();
    }

    // Extract patterns using AI
    const patterns = await this.extractEmailPatternsAI(emails);

    return {
      analyzed_at: new Date().toISOString(),
      email_count: emails.length,
      patterns,
      sample_emails: emails.slice(0, 5).map(e => ({
        subject: e.subject || '',
        opening: this.extractOpening(e.body),
        closing: this.extractClosing(e.body),
        length: e.body?.length || 0,
      })),
    };
  }

  private async extractEmailPatternsAI(emails: Array<{ subject?: string; body?: string; sender_email?: string }>): Promise<EmailVoicePatterns> {
    const sampleEmails = emails.slice(0, 25).map(e => ({
      subject: e.subject,
      body: e.body?.substring(0, 600) || '',
      sender: e.sender_email,
    }));

    const prompt = `Analyze these ACTUAL sent emails and extract authentic voice patterns.

Focus on HOW they actually write, not generic email advice.

${JSON.stringify(sampleEmails, null, 2)}

Return JSON:
{
  "common_openings": ["array of ACTUAL opening lines used frequently"],
  "common_closings": ["array of ACTUAL closing lines used frequently"],
  "signature_patterns": ["how they actually sign off - exact phrases"],
  "avg_email_length": number (word count),
  "formality_level": "casual | professional | formal",
  "uses_exclamations": boolean,
  "typical_greeting_style": "Hi | Hello | Hey | [Name],",
  "typical_closing_style": "Best | Thanks | Regards | Talk soon",
  "common_transitions": ["phrases used between paragraphs"],
  "question_asking_style": "direct | consultative | open-ended",
  "call_to_action_style": "direct | subtle | collaborative",
  "paragraph_length": "short | medium | long",
  "uses_bullet_points": boolean,
  "tone_characteristics": ["friendly", "professional", "consultative"],
  "common_phrases": ["signature phrases they use repeatedly"]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.extractEmailPatternsBasic(emails);
    } catch (error) {
      console.error('[EmailVoiceAnalyzer] AI pattern extraction error:', error);
      return this.extractEmailPatternsBasic(emails);
    }
  }

  private extractEmailPatternsBasic(emails: Array<{ body?: string }>): EmailVoicePatterns {
    // Fallback basic analysis
    const avgLength = emails.reduce((sum, e) => sum + (e.body?.length || 0), 0) / emails.length;

    return {
      common_openings: ['Hey [Name],', 'Hi [Name],', '[Name],'],
      common_closings: ['Let me know what you think', 'Happy to discuss', 'Talk soon'],
      signature_patterns: ['Bill', '-bill', 'Bill Douglas'],
      avg_email_length: Math.round(avgLength / 5), // Rough word count
      formality_level: 'professional',
      uses_exclamations: false,
      typical_greeting_style: 'Hey | Hi | [Name],',
      typical_closing_style: 'Bill',
      common_transitions: ['Here\'s the thing', 'The way I see it'],
      question_asking_style: 'direct',
      call_to_action_style: 'direct',
      paragraph_length: 'short',
      uses_bullet_points: true,
      tone_characteristics: ['direct', 'confident', 'strategic'],
      common_phrases: ['Here\'s what I\'m thinking', 'Does that make sense?', 'Happy to discuss'],
    };
  }

  private formatEmailStyleGuide(emailVoice: EmailVoiceAnalysis): string {
    return `
═══════════════════════════════════════════════
📧 EMAIL VOICE STYLE GUIDE (AUTHENTIC)
═══════════════════════════════════════════════

Analyzed: ${emailVoice.analyzed_at}
Emails: ${emailVoice.email_count}

COMMON OPENINGS:
${emailVoice.patterns.common_openings.map(o => `- "${o}"`).join('\n')}

COMMON CLOSINGS:
${emailVoice.patterns.common_closings.map(c => `- "${c}"`).join('\n')}

SIGNATURE PATTERNS:
${emailVoice.patterns.signature_patterns.map(s => `- ${s}`).join('\n')}

EMAIL STYLE:
- Greeting: ${emailVoice.patterns.typical_greeting_style}
- Closing: ${emailVoice.patterns.typical_closing_style}
- Formality: ${emailVoice.patterns.formality_level}
- Avg Length: ${emailVoice.patterns.avg_email_length} words
- Uses exclamations: ${emailVoice.patterns.uses_exclamations ? 'Yes' : 'No'}
- Uses bullet points: ${emailVoice.patterns.uses_bullet_points ? 'Yes' : 'No'}

TONE CHARACTERISTICS:
${emailVoice.patterns.tone_characteristics.map(t => `- ${t}`).join('\n')}

COMMON PHRASES:
${emailVoice.patterns.common_phrases.map(p => `- "${p}"`).join('\n')}

CRITICAL: When drafting emails, use these EXACT patterns.
DO NOT use generic email templates - match the authentic voice.
═══════════════════════════════════════════════
`;
  }

  private getDefaultEmailVoice(): string {
    return `
═══════════════════════════════════════════════
📧 EMAIL VOICE STYLE GUIDE (DEFAULT)
═══════════════════════════════════════════════

EMAIL STYLE:
- Direct and confident
- Short, punchy sentences
- Strategic focus
- Professional but not corporate
- Clear calls to action

AVOID:
- "I hope this email finds you well"
- "Please let me know if you have any questions"
- "Thank you for your time and consideration"
- Robotic AI phrases

USE:
- Natural openings ("Hey [Name]," or just "[Name],")
- Direct language
- Clear next steps
- Simple signature ("Bill")
═══════════════════════════════════════════════
`;
  }

  private getDefaultEmailVoiceAnalysis(): EmailVoiceAnalysis {
    return {
      analyzed_at: new Date().toISOString(),
      email_count: 0,
      patterns: {
        common_openings: ['Hey [Name],', '[Name],'],
        common_closings: ['Let me know what you think', 'Happy to discuss'],
        signature_patterns: ['Bill', '-bill'],
        avg_email_length: 150,
        formality_level: 'professional',
        uses_exclamations: false,
        typical_greeting_style: 'Hey | [Name],',
        typical_closing_style: 'Bill',
        common_transitions: ['Here\'s the thing', 'The way I see it'],
        question_asking_style: 'direct',
        call_to_action_style: 'direct',
        paragraph_length: 'short',
        uses_bullet_points: true,
        tone_characteristics: ['direct', 'confident', 'strategic'],
        common_phrases: ['Here\'s what I\'m thinking', 'Does that make sense?'],
      },
      sample_emails: [],
    };
  }

  private extractOpening(emailBody: string): string {
    if (!emailBody) return '';
    const lines = emailBody.split('\n').filter(l => l.trim().length > 0);
    return lines.slice(0, 2).join(' ').substring(0, 200);
  }

  private extractClosing(emailBody: string): string {
    if (!emailBody) return '';
    const lines = emailBody.split('\n').filter(l => l.trim().length > 0);
    return lines.slice(-3).join(' ').substring(0, 200);
  }
}
