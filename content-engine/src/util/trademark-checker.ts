const TRADEMARKS: Array<{ term: string; mark: string; regex: RegExp }> = [
  { term: 'Peak Property Performance', mark: '®', regex: /Peak Property Performance(?!®)/gi },
  { term: 'PPP 5C', mark: '™', regex: /PPP 5C(?!™)/gi },
  { term: 'BoT', mark: '®', regex: /\bBoT(?!®)\b/g },
  { term: 'Building of Things', mark: '®', regex: /Building of Things(?!®)/gi },
  { term: 'ElasticISP', mark: '®', regex: /ElasticISP(?!®)/gi },
  { term: '5S', mark: '®', regex: /\b5S(?!®)\b/g },
  { term: 'SIC', mark: '®', regex: /\bSIC(?!®)\b/g },
  { term: 'Property Brain', mark: '™', regex: /Property Brain(?!™)/gi },
  { term: 'Portfolio Brain', mark: '™', regex: /Portfolio Brain(?!™)/gi },
  { term: 'PPP Audit', mark: '™', regex: /PPP Audit(?!™)/gi },
];

export function checkTrademarks(text: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const tm of TRADEMARKS) {
    const matches = text.match(tm.regex);
    if (matches && matches.length > 0) {
      const withMark = new RegExp(`${tm.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${tm.mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (!withMark.test(text)) {
        errors.push(`"${tm.term}" appears without its ${tm.mark} mark anywhere in the text`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
