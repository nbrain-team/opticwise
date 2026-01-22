/**
 * Execution Planner
 * 
 * Generates execution plans before running queries.
 * Shows users what the agent will do before doing it.
 * 
 * Based on Newbury Partners architecture.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ToolRegistry } from './tool-registry';

interface ExecutionStep {
  tool: string;
  params: Record<string, any>;
  reason: string;
  confidence: number;
}

export interface ExecutionPlan {
  understanding: string;
  steps: ExecutionStep[];
  estimated_time: string;
  requires_approval: string[];
}

export class ExecutionPlanner {
  private anthropic: Anthropic;
  private toolRegistry: ToolRegistry;

  constructor(anthropic: Anthropic, toolRegistry: ToolRegistry) {
    this.anthropic = anthropic;
    this.toolRegistry = toolRegistry;
  }

  async generatePlan(params: {
    userMessage: string;
    conversationHistory: Array<{ role: string; content: string }>;
    availableContext?: string;
  }): Promise<ExecutionPlan> {
    const { userMessage, conversationHistory, availableContext } = params;

    // Get tool descriptions
    const availableTools = this.toolRegistry.getToolDescriptions();
    const toolsJson = JSON.stringify(availableTools, null, 2);

    // Build planning prompt
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const systemPrompt = `You are an AI execution planner for OpticWise.

⏰ CURRENT DATE: ${currentDate}

Your task is to create a CONCISE execution plan. Return JSON:
{
  "understanding": "Brief summary of what the user wants",
  "steps": [
    {
      "tool": "tool_name",
      "params": {...},
      "reason": "Why this step is needed",
      "confidence": 0.9
    }
  ],
  "estimated_time": "10 seconds",
  "requires_approval": []
}

CRITICAL EFFICIENCY RULES:
- MAXIMUM 3 TOOLS PER QUERY - Be selective and efficient
- Choose the SINGLE BEST tool for the task
- For simple questions, use 0-1 tools and rely on existing context
- Don't search if the answer is obvious from context

Available tools:
${toolsJson}

${availableContext ? `\nAVAILABLE CONTEXT:\n${availableContext}\n` : ''}

Conversation history:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{ role: 'user', content: `${systemPrompt}\n\nUser query: ${userMessage}` }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackPlan(userMessage);
    } catch (error) {
      console.error('[ExecutionPlanner] Error:', error);
      return this.generateFallbackPlan(userMessage);
    }
  }

  private generateFallbackPlan(userMessage: string): ExecutionPlan {
    // Simple fallback plan
    const needsTranscripts = userMessage.toLowerCase().includes('meeting') || 
                             userMessage.toLowerCase().includes('call') ||
                             userMessage.toLowerCase().includes('discuss');
    
    const needsCRM = userMessage.toLowerCase().includes('deal') ||
                     userMessage.toLowerCase().includes('contact') ||
                     userMessage.toLowerCase().includes('pipeline');

    const steps: ExecutionStep[] = [];

    if (needsTranscripts) {
      steps.push({
        tool: 'search_transcripts',
        params: { query: userMessage, limit: 5 },
        reason: 'Search meeting transcripts for relevant discussions',
        confidence: 0.8,
      });
    }

    if (needsCRM) {
      steps.push({
        tool: 'search_crm',
        params: { query: userMessage, type: 'all', limit: 20 },
        reason: 'Search CRM data for deals and contacts',
        confidence: 0.8,
      });
    }

    return {
      understanding: `User wants information about: ${userMessage.slice(0, 100)}`,
      steps,
      estimated_time: steps.length === 0 ? '2 seconds' : `${steps.length * 3} seconds`,
      requires_approval: [],
    };
  }
}
