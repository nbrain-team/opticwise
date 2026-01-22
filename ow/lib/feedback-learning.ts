/**
 * Feedback Learning Service
 * 
 * Continuously learns from user feedback to improve response quality.
 * Analyzes patterns in negative feedback and collects training data.
 * 
 * Based on Newbury Partners architecture.
 */

import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

interface FeedbackPattern {
  pattern: string;
  frequency: 'high' | 'medium' | 'low';
  category: 'accuracy' | 'tone' | 'completeness' | 'formatting' | 'tool_usage' | 'other';
  examples_count: number;
  impact: 'high' | 'medium' | 'low';
}

interface FeedbackAnalysis {
  total_analyzed: number;
  patterns: FeedbackPattern[];
  root_causes: string[];
  priority_fixes: string[];
  analyzed_at: string;
}

export class FeedbackLearningService {
  private dbPool: Pool;
  private anthropic: Anthropic;

  constructor(dbPool: Pool, anthropic: Anthropic) {
    this.dbPool = dbPool;
    this.anthropic = anthropic;
  }

  async analyzeNegativeFeedback(params: {
    min_rating?: number;
    limit?: number;
    days_back?: number;
  } = {}): Promise<FeedbackAnalysis> {
    const { min_rating = 2, limit = 100, days_back = 30 } = params;

    console.log(`[FeedbackLearning] Analyzing negative feedback (rating <= ${min_rating}, last ${days_back} days)`);

    // Fetch negative feedback with context
    const result = await this.dbPool.query(
      `SELECT 
        f.id as feedback_id,
        f.rating,
        f.category,
        f.feedback as text_feedback,
        um.content as user_message,
        am.content as assistant_response,
        am.sources
      FROM "AIFeedback" f
      JOIN "AgentChatMessage" am ON f."messageId" = am.id
      LEFT JOIN LATERAL (
        SELECT content 
        FROM "AgentChatMessage" 
        WHERE "sessionId" = am."sessionId"
          AND role = 'user' 
          AND "createdAt" < am."createdAt"
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) um ON true
      WHERE f.rating <= $1
        AND f."createdAt" > NOW() - INTERVAL '${days_back} days'
      ORDER BY f."createdAt" DESC
      LIMIT $2`,
      [min_rating, limit]
    );

    const negativeFeedback = result.rows;

    if (negativeFeedback.length === 0) {
      return {
        total_analyzed: 0,
        patterns: [],
        root_causes: [],
        priority_fixes: [],
        analyzed_at: new Date().toISOString(),
      };
    }

    console.log(`[FeedbackLearning] Found ${negativeFeedback.length} negative feedback items`);

    // Identify patterns using AI
    const patterns = await this.identifyFailurePatterns(negativeFeedback);

    // Save analysis results
    await this.saveAnalysisResults({
      analysis_type: 'negative_feedback',
      total_analyzed: negativeFeedback.length,
      patterns: patterns.patterns,
      recommendations: patterns.priority_fixes,
    });

    return {
      total_analyzed: negativeFeedback.length,
      patterns: patterns.patterns,
      root_causes: patterns.root_causes,
      priority_fixes: patterns.priority_fixes,
      analyzed_at: new Date().toISOString(),
    };
  }

  private async identifyFailurePatterns(feedbackData: any[]): Promise<{
    patterns: FeedbackPattern[];
    root_causes: string[];
    priority_fixes: string[];
  }> {
    if (feedbackData.length === 0) {
      return { patterns: [], root_causes: [], priority_fixes: [] };
    }

    const sample = feedbackData.slice(0, 20);

    const examplesText = sample
      .map(
        (item, i) => `
Example ${i + 1}:
User Query: ${item.user_message}
AI Response: ${(item.assistant_response || '').substring(0, 500)}...
Rating: ${item.rating}/5
User Feedback: ${item.text_feedback || 'None'}
---`
      )
      .join('\n');

    const prompt = `Analyze these negative user feedback examples to identify patterns and root causes.

NEGATIVE FEEDBACK EXAMPLES:
${examplesText}

Identify:
1. Common failure patterns (what went wrong repeatedly)
2. Root causes (why these failures occurred)
3. Categories of issues (accuracy, tone, completeness, formatting, tool_usage)
4. Specific improvement opportunities

Return JSON:
{
  "patterns": [
    {
      "pattern": "description of pattern",
      "frequency": "high|medium|low",
      "category": "accuracy|tone|completeness|formatting|tool_usage|other",
      "examples_count": number,
      "impact": "high|medium|low"
    }
  ],
  "root_causes": ["cause 1", "cause 2"],
  "priority_fixes": ["fix 1", "fix 2"]
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { patterns: [], root_causes: [], priority_fixes: [] };
    } catch (error) {
      console.error('[FeedbackLearning] Pattern identification error:', error);
      return { patterns: [], root_causes: [], priority_fixes: [] };
    }
  }

  async collectTrainingExamples(params: {
    min_rating?: number;
    limit?: number;
    days_back?: number;
  } = {}): Promise<{
    total_examples: number;
    average_rating: number;
    formatted_data: any[];
    collected_at: string;
  }> {
    const { min_rating = 4, limit = 500, days_back = 90 } = params;

    console.log(`[FeedbackLearning] Collecting training examples (rating >= ${min_rating})`);

    // Fetch high-quality responses
    const result = await this.dbPool.query(
      `SELECT 
        um.content as user_message,
        am.content as assistant_response,
        am.sources,
        f.rating,
        f.feedback as text_feedback
      FROM "AgentChatMessage" am
      JOIN "AIFeedback" f ON f."messageId" = am.id
      LEFT JOIN LATERAL (
        SELECT content 
        FROM "AgentChatMessage" 
        WHERE "sessionId" = am."sessionId"
          AND role = 'user' 
          AND "createdAt" < am."createdAt"
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) um ON true
      WHERE f.rating >= $1
        AND f."createdAt" > NOW() - INTERVAL '${days_back} days'
        AND am.role = 'assistant'
      ORDER BY f.rating DESC, am."createdAt" DESC
      LIMIT $2`,
      [min_rating, limit]
    );

    const examples = result.rows;

    if (examples.length === 0) {
      return {
        total_examples: 0,
        average_rating: 0,
        formatted_data: [],
        collected_at: new Date().toISOString(),
      };
    }

    // Format for fine-tuning (Claude/OpenAI format)
    const formatted = examples.map(example => ({
      messages: [
        { role: 'user', content: example.user_message },
        { role: 'assistant', content: example.assistant_response },
      ],
      metadata: {
        rating: example.rating,
        feedback: example.text_feedback,
      },
    }));

    const avgRating = examples.reduce((sum, e) => sum + e.rating, 0) / examples.length;

    console.log(`[FeedbackLearning] Collected ${examples.length} training examples (avg rating: ${avgRating.toFixed(2)})`);

    return {
      total_examples: examples.length,
      average_rating: avgRating,
      formatted_data: formatted,
      collected_at: new Date().toISOString(),
    };
  }

  private async saveAnalysisResults(params: {
    analysis_type: string;
    total_analyzed: number;
    patterns: any;
    recommendations: any;
  }): Promise<void> {
    try {
      await this.dbPool.query(
        `INSERT INTO "FeedbackAnalysis" 
         ("analysisType", "totalAnalyzed", patterns, recommendations, "analyzedAt")
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          params.analysis_type,
          params.total_analyzed,
          JSON.stringify(params.patterns),
          JSON.stringify(params.recommendations),
        ]
      );
    } catch (error) {
      console.error('[FeedbackLearning] Error saving analysis:', error);
    }
  }

  async runAutomatedAnalysis(): Promise<{
    negative_feedback_analyzed: number;
    patterns_identified: number;
    recommendations_generated: number;
    training_examples_collected: number;
  }> {
    console.log('[FeedbackLearning] Starting automated feedback analysis...');

    // Analyze negative feedback
    const negativeAnalysis = await this.analyzeNegativeFeedback({
      min_rating: 2,
      limit: 100,
      days_back: 7, // Weekly analysis
    });

    // Collect training examples
    const trainingData = await this.collectTrainingExamples({
      min_rating: 4,
      limit: 100,
      days_back: 30,
    });

    console.log('[FeedbackLearning] ✅ Automated analysis complete');

    return {
      negative_feedback_analyzed: negativeAnalysis.total_analyzed,
      patterns_identified: negativeAnalysis.patterns.length,
      recommendations_generated: negativeAnalysis.priority_fixes.length,
      training_examples_collected: trainingData.total_examples,
    };
  }
}
