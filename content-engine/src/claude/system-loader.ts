import fs from 'fs';
import path from 'path';
import { createLogger } from '../util/logger.js';

const log = createLogger('system-loader');

export function loadSystemPrompts(promptsDir: string, author?: 'bill' | 'drew'): string {
  const systemDir = path.join(promptsDir, 'system');

  if (!fs.existsSync(systemDir)) {
    throw new Error(`System prompts directory not found: ${systemDir}`);
  }

  const files = fs.readdirSync(systemDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const parts: string[] = [];

  for (const file of files) {
    if (author === 'bill' && file === '11-drew-voice-canon.md') continue;
    if (author === 'drew' && file === '10-bill-voice-canon.md') continue;

    const content = fs.readFileSync(path.join(systemDir, file), 'utf-8');
    parts.push(content);
  }

  log.info('system_prompts_loaded', {
    fileCount: parts.length,
    author: author || 'all',
    totalChars: parts.reduce((sum, p) => sum + p.length, 0),
  });

  return parts.join('\n\n---\n\n');
}

export function loadTaskPrompt(promptsDir: string, taskFile: string): string {
  const taskPath = path.join(promptsDir, 'tasks', taskFile);

  if (!fs.existsSync(taskPath)) {
    throw new Error(`Task prompt not found: ${taskPath}`);
  }

  return fs.readFileSync(taskPath, 'utf-8');
}
