/**
 * Tool Registry System
 * 
 * Manages all available tools for the AI agent.
 * Tools are modular, auto-loading, and self-contained.
 * 
 * Based on Newbury Partners architecture.
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'knowledge' | 'crm' | 'email' | 'calendar' | 'analysis' | 'general';
  requiresApproval: boolean;
  parameters: Record<string, ToolParameter>;
  execute: (params: any, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  dbPool: Pool;
  openai: OpenAI;
  pinecone: Pinecone;
  userId?: string;
  sessionId?: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
  source_type?: string;
  data_points?: any[];
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition>;

  constructor() {
    this.tools = new Map();
  }

  registerTool(tool: ToolDefinition): void {
    if (!tool.name || !tool.execute) {
      throw new Error('Tool must have a name and execute function');
    }

    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolDescriptions(): Array<{
    name: string;
    description: string;
    parameters: Record<string, ToolParameter>;
    category: string;
  }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      category: tool.category,
    }));
  }

  validateParameters(toolName: string, params: any): boolean {
    const tool = this.getTool(toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const toolParams = tool.parameters;

    for (const [paramName, paramConfig] of Object.entries(toolParams)) {
      if (paramConfig.required && !(paramName in params)) {
        throw new Error(`Missing required parameter: ${paramName} for tool ${toolName}`);
      }
    }

    return true;
  }

  async executeTool(
    toolName: string,
    params: any,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.getTool(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        confidence: 0,
      };
    }

    try {
      this.validateParameters(toolName, params);
      const result = await tool.execute(params, context);
      return result;
    } catch (error) {
      console.error(`[ToolRegistry] Error executing ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
      };
    }
  }
}

// Global registry instance
export const toolRegistry = new ToolRegistry();
