const BANNED_WORDS = [
  'leverage',
  'synergy',
  'ecosystem',
  'holistic',
  'seamless',
  'cutting-edge',
];

const SEAMLESS_EXCEPTION = /seamless\s+mobility/i;

export function checkBannedWords(text: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = [...text.matchAll(regex)];
    for (const match of matches) {
      if (word === 'seamless' && SEAMLESS_EXCEPTION.test(text.slice(Math.max(0, match.index! - 5), match.index! + 25))) {
        continue;
      }
      const context = text.slice(Math.max(0, match.index! - 30), match.index! + word.length + 30).replace(/\n/g, ' ');
      errors.push(`Banned word "${word}" found: "...${context}..."`);
    }
  }

  return { valid: errors.length === 0, errors };
}
