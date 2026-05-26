export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function validateWordCount(text: string, min: number, max: number, label: string): string | null {
  const count = wordCount(text);
  if (count < min) return `${label}: ${count} words (minimum ${min})`;
  if (count > max) return `${label}: ${count} words (maximum ${max})`;
  return null;
}
