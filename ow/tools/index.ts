/**
 * Tool Index
 * 
 * Exports all available tools for the AI agent
 */

import { toolRegistry } from '../lib/tool-registry';
import { searchTranscriptsTool } from './search-transcripts';
import { searchCRMTool } from './search-crm';
import { searchEmailsTool } from './search-emails';

// Register all tools
export function registerAllTools() {
  toolRegistry.registerTool(searchTranscriptsTool);
  toolRegistry.registerTool(searchCRMTool);
  toolRegistry.registerTool(searchEmailsTool);
  
  console.log(`[ToolRegistry] Registered ${toolRegistry.listTools().length} tools`);
}

export { toolRegistry };
