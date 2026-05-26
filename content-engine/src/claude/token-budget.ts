export const TOKEN_BUDGETS = {
  sourceExtraction: 500,
  trendDetection: 4_000,
  briefing: 6_000,
  authorPackage: 11_000,
} as const;

export type TokenBudgetKey = keyof typeof TOKEN_BUDGETS;

export const MODELS = {
  opus: 'claude-opus-4-6',
  haiku: 'claude-haiku-4-5-20251001',
} as const;
