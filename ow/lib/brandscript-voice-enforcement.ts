/**
 * OpticWise BrandScript Voice Enforcement (May 2026 canon)
 *
 * Post-processing functions to ensure responses follow brand voice guidelines.
 */

import { COPY_BLOCKS } from './brandscript-prompt';

/**
 * Enforce all brand voice rules on generated text.
 *
 * Order matters: terminology fixes run first, then phrasing replacements,
 * then trademark first-use, then drift-only checks (PPP 5C order).
 */
export function enforceBrandVoice(text: string): string {
  let corrected = text;

  corrected = enforceDataAndDigitalInfrastructure(corrected);
  corrected = replacePropTechFraming(corrected);
  corrected = replaceBannedWords(corrected);
  corrected = enforcePPP5COrder(corrected);
  corrected = enforce5SUX(corrected);
  corrected = replaceVendorLanguage(corrected);
  corrected = enforceTrademarkFirstUse(corrected);

  return corrected;
}

/**
 * Ensure "infrastructure" is always "data & digital infrastructure" or
 * "digital infrastructure" with surrounding context. Order of operations:
 *   1. Repair the canonical pair "data & digital infrastructure" if any
 *      partial form was generated.
 *   2. Promote bare "digital infrastructure" to the canonical pair UNLESS
 *      it sits inside a fixed phrase like "Layer 1: Managed digital
 *      infrastructure".
 *   3. Promote bare "infrastructure" to "digital infrastructure".
 */
function enforceDataAndDigitalInfrastructure(text: string): string {
  let out = text;

  // Step 1: bare "infrastructure" -> "digital infrastructure"
  out = out.replace(
    /(?<!data\s&\s)(?<!data\sand\s)(?<!digital\s)(?<!Digital\s)\b([Ii])nfrastructure\b/g,
    (_m, first: string) => (first === 'I' ? 'Digital Infrastructure' : 'digital infrastructure')
  );

  // Step 2: promote first bare "digital infrastructure" in a paragraph to the
  // canonical pair, but only when it's not already preceded by "data &".
  // We avoid replacing inside the literal phrase "managed digital
  // infrastructure" which is permitted.
  out = out.replace(
    /(?<!data\s&\s)(?<!data\sand\s)(?<!Managed\s)(?<!managed\s)\b([Dd])igital ([Ii])nfrastructure\b/g,
    (match, d: string, i: string) => {
      // Preserve case
      if (d === 'D' && i === 'I') return 'Data & Digital Infrastructure';
      return 'data & digital infrastructure';
    }
  );

  return out;
}

/**
 * Replace PropTech framing with strategic asset framing.
 * "PropTech" is allowed when discussing the broader market (e.g., M&A or
 * vendor consolidation) but NOT when describing OpticWise itself.
 */
function replacePropTechFraming(text: string): string {
  const replacements: Record<string, string> = {
    'PropTech stack': 'data & digital infrastructure platform',
    'proptech stack': 'data & digital infrastructure platform',
    'PropTech solution': 'data & digital infrastructure approach',
    'proptech solution': 'data & digital infrastructure approach',
    'PropTech vendor': 'platform vendor',
    'proptech vendor': 'platform vendor',
    'smart building gadgets': 'building systems',
    'smart building technology': 'data & digital infrastructure',
    'IoT devices': 'connected building systems',
    'tech upgrade': 'data & digital infrastructure transformation',
    'technology stack': 'data & digital infrastructure platform'
  };

  let corrected = text;
  Object.entries(replacements).forEach(([wrong, right]) => {
    const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    corrected = corrected.replace(regex, right);
  });

  return corrected;
}

/**
 * Strip banned words and phrases per the May 2026 canon.
 *
 * Hard removals: leverage, synergy, ecosystem, holistic, seamless (outside
 * "Seamless Mobility" in 5S), cutting-edge, ESG, best-in-class, world-class,
 * robust, turnkey, next-gen.
 *
 * "ESG" is rewritten to neutral operating-language. The other banned words
 * are rewritten to plain alternatives. We do not silently delete sentences;
 * we substitute and let the reader / next pass catch any awkwardness.
 */
function replaceBannedWords(text: string): string {
  let out = text;

  // ESG -> operations / utilities / risk / data, contextually:
  // - "ESG compliance" -> "operating compliance"
  // - "ESG reporting" -> "operations and risk reporting"
  // - "ESG goals" -> "operating goals"
  // - bare "ESG" -> "operations and risk"
  out = out.replace(/\bESG\s+compliance\b/g, 'operating compliance');
  out = out.replace(/\bESG\s+reporting\b/g, 'operations and risk reporting');
  out = out.replace(/\bESG\s+goals\b/g, 'operating goals');
  out = out.replace(/\bESG\s+performance\b/g, 'operating performance');
  out = out.replace(/\bESG\s+(non[-\s]?compliance)\b/gi, 'operating non-compliance');
  out = out.replace(/\bESG\b/g, 'operations and risk');

  // Verb "leverage" -> "use"; noun "leverage" of capability/infrastructure -> "use"
  out = out.replace(/\bleverage\b/g, 'use');
  out = out.replace(/\bLeverage\b/g, 'Use');
  out = out.replace(/\bleveraging\b/gi, 'using');

  const swaps: Record<string, string> = {
    'synergy': 'fit',
    'synergies': 'shared lift',
    'ecosystem': 'environment',
    'holistic': 'end-to-end',
    'cutting-edge': 'modern',
    'cutting edge': 'modern',
    'best-in-class': 'top-tier',
    'world-class': 'top-tier',
    'robust': 'resilient',
    'turnkey': 'ready-to-run',
    'next-gen': 'modern',
    'next generation': 'modern',
  };
  Object.entries(swaps).forEach(([wrong, right]) => {
    const regex = new RegExp(`\\b${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    out = out.replace(regex, right);
  });

  // "seamless" -> "smooth" UNLESS the next word is "Mobility" (5S preserved)
  out = out.replace(/\bseamless\b(?!\s+Mobility)/gi, (match) =>
    match[0] === match[0].toUpperCase() ? 'Smooth' : 'smooth'
  );

  return out;
}

/**
 * Enforce trademark first-use. On the first occurrence of each protected
 * term in the response, append the trademark symbol if missing. Subsequent
 * uses are left alone. Operates conservatively (skips when text already
 * has the symbol on the first occurrence).
 */
function enforceTrademarkFirstUse(text: string): string {
  const firstUseList: Array<{ term: string; symbol: '™' | '®' }> = [
    { term: 'Property Brain', symbol: '™' },
    { term: 'Portfolio Brain', symbol: '™' },
    { term: 'PPP Audit', symbol: '™' },
    { term: 'PPP 5C', symbol: '™' },
    { term: 'Peak Property Performance', symbol: '®' },
    { term: 'BoT', symbol: '®' },
    { term: 'ElasticISP', symbol: '®' },
    { term: 'SIC', symbol: '®' },
    { term: '5S', symbol: '®' },
  ];

  let out = text;
  for (const { term, symbol } of firstUseList) {
    // Find the first occurrence; if it's already followed by ™/®, skip.
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b(?!\\s*[™®])`);
    const match = out.match(re);
    if (match && match.index !== undefined) {
      const before = out.slice(0, match.index + match[0].length);
      const after = out.slice(match.index + match[0].length);
      out = before + symbol + after;
    }
  }
  return out;
}

/**
 * Ensure PPP 5C is in correct order when mentioned
 */
function enforcePPP5COrder(text: string): string {
  // If PPP 5C is mentioned out of order, flag it (don't auto-fix as context matters)
  // The correct order is: Clarify, Connect, Collect, Coordinate, Control
  
  // Check for common misordering patterns
  const correctOrder = ['Clarify', 'Connect', 'Collect', 'Coordinate', 'Control'];
  const correctOrderLower = correctOrder.map(c => c.toLowerCase());
  
  // If we find a numbered list with these terms, ensure they're in order
  const fiveCPattern = /1[.)]\s*(Clarify|Connect|Collect|Coordinate|Control)[\s\S]*?2[.)]\s*(Clarify|Connect|Collect|Coordinate|Control)[\s\S]*?3[.)]\s*(Clarify|Connect|Collect|Coordinate|Control)[\s\S]*?4[.)]\s*(Clarify|Connect|Collect|Coordinate|Control)[\s\S]*?5[.)]\s*(Clarify|Connect|Collect|Coordinate|Control)/i;
  
  const match = text.match(fiveCPattern);
  if (match) {
    const found = [match[1], match[2], match[3], match[4], match[5]];
    const foundLower = found.map(f => f.toLowerCase());
    
    // Check if order is wrong
    const isWrongOrder = foundLower.some((term, index) => term !== correctOrderLower[index]);
    
    if (isWrongOrder) {
      // Replace with correct order
      // This is complex, so for now just log a warning
      console.warn('[BrandScript] PPP 5C order may be incorrect in response');
    }
  }
  
  return text;
}

/**
 * Ensure 5S UX is correctly defined when mentioned
 */
function enforce5SUX(text: string): string {
  // If 5S is mentioned, ensure it's defined correctly
  // Correct: Seamless Mobility, Security, Stability, Speed, Service
  
  // Replace common incorrect definitions
  const corrections: Record<string, string> = {
    'Seamless, Security, Stability, Speed, Service': 'Seamless Mobility, Security, Stability, Speed, Service',
    'Seamless connectivity, Security, Stability, Speed, Service': 'Seamless Mobility, Security, Stability, Speed, Service',
    'Seamless experience, Security, Stability, Speed, Service': 'Seamless Mobility, Security, Stability, Speed, Service'
  };
  
  let corrected = text;
  Object.entries(corrections).forEach(([wrong, right]) => {
    corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
  });
  
  return corrected;
}

/**
 * Replace vendor-sounding language with guide language
 */
function replaceVendorLanguage(text: string): string {
  const replacements: Record<string, string> = {
    'we sell': 'we help you',
    'our product': 'our approach',
    'our solution': 'our partnership',
    'buy our': 'partner with us on',
    'purchase our': 'invest in',
    'vendor relationship': 'partnership',
    'as a vendor': 'as your guide',
    'selling you': 'helping you'
  };
  
  let corrected = text;
  Object.entries(replacements).forEach(([wrong, right]) => {
    const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    corrected = corrected.replace(regex, right);
  });
  
  return corrected;
}

/**
 * Check if response follows SB7 structure
 * Returns validation warnings (for logging, not blocking)
 */
export function validateSB7Structure(text: string): {
  isValid: boolean;
  warnings: string[];
  score: number;
} {
  const warnings: string[] = [];
  let score = 0;
  
  // Check for hero/problem framing
  const hasOwnerLanguage = /\byou\b/i.test(text) && /\byour\b/i.test(text);
  if (hasOwnerLanguage) {
    score++;
  } else {
    warnings.push('Missing "you" language (owner POV)');
  }
  
  // Check for problem framing
  const hasProblemFraming = /vendor|fragment|disconnect|control|leak/i.test(text);
  if (hasProblemFraming) {
    score++;
  } else {
    warnings.push('Missing problem framing');
  }
  
  // Check for reframing line or similar
  const hasReframingLine = /if you don't own|vendor.*own|control.*infrastructure/i.test(text);
  if (hasReframingLine) {
    score++;
  } else {
    warnings.push('Missing reframing line or ownership theme');
  }
  
  // Check for guide positioning
  const hasGuideLanguage = /opticwise|guide|help|partner/i.test(text);
  if (hasGuideLanguage) {
    score++;
  } else {
    warnings.push('Missing guide positioning');
  }
  
  // Check for plan (PPP 5C)
  const hasPlan = /clarify|connect|collect|coordinate|control|ppp|5c/i.test(text);
  if (hasPlan) {
    score++;
  } else {
    warnings.push('Missing plan reference (PPP 5C)');
  }
  
  // Check for outcomes
  const hasOutcomes = /noi|tenant|retention|experience|control|future|ai.*ready/i.test(text);
  if (hasOutcomes) {
    score++;
  } else {
    warnings.push('Missing outcome focus');
  }
  
  // Check for CTA
  const hasCTA = /audit|call|schedule|book|explore|start|next step/i.test(text);
  if (hasCTA) {
    score++;
  } else {
    warnings.push('Missing clear CTA');
  }
  
  return {
    isValid: score >= 5, // Pass if 5+ out of 7
    warnings,
    score
  };
}

/**
 * Inject reframing line if appropriate context exists but line is missing
 */
export function injectReframingLineIfNeeded(text: string): string {
  // If talking about vendors, ownership, or control but missing the reframing line
  const hasVendorContext = /vendor|bulk.*agreement|isp|comcast|at&t|spectrum/i.test(text);
  const hasOwnershipContext = /own|control|dependency|lock.*in/i.test(text);
  const hasReframingLine = /if you don't own.*infrastructure.*vendors do/i.test(text);
  
  if ((hasVendorContext || hasOwnershipContext) && !hasReframingLine && text.length > 200) {
    // Find a good place to inject it (after first paragraph or before plan)
    const firstParagraphEnd = text.indexOf('\n\n');
    if (firstParagraphEnd > 0 && firstParagraphEnd < 500) {
      const injection = `\n\n> **Key Insight:** ${COPY_BLOCKS.reframingLine}\n`;
      return text.slice(0, firstParagraphEnd) + injection + text.slice(firstParagraphEnd);
    }
  }
  
  return text;
}

/**
 * Ensure outcomes are tied to features
 * Adds outcome context to feature mentions when missing
 */
export function tieFeaturesToOutcomes(text: string): string {
  // This is a light enhancement - adds outcome hints when features are mentioned alone
  const featureOutcomeMap: Record<string, string> = {
    'PPP Audit': ' (reveals value leaks and NOI upside)',
    'BoT®': ' (connects systems for usable data)',
    'ElasticISP®': ' (resilient connectivity under owner control)',
    '5S® UX': ' (drives retention and satisfaction)',
    'data ownership': ' (enables AI readiness and long-term valuation)',
    'privacy-first': ' (builds tenant trust and reduces risk)'
  };
  
  let enhanced = text;
  
  // Only add if feature is mentioned without nearby outcome language
  Object.entries(featureOutcomeMap).forEach(([feature, outcome]) => {
    const regex = new RegExp(`\\b${feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?!.*?\\(.*?\\))`, 'gi');
    
    // Check if feature exists and doesn't already have outcome in parentheses
    if (regex.test(text)) {
      // Only add outcome if not already present nearby
      const featureIndex = text.toLowerCase().indexOf(feature.toLowerCase());
      if (featureIndex > -1) {
        const contextWindow = text.slice(Math.max(0, featureIndex - 100), Math.min(text.length, featureIndex + 100));
        const hasNearbyOutcome = /noi|retention|control|tenant|experience|revenue|value|readiness/i.test(contextWindow);
        
        if (!hasNearbyOutcome) {
          enhanced = enhanced.replace(regex, `${feature}${outcome}`);
        }
      }
    }
  });
  
  return enhanced;
}
