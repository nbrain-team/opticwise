/**
 * OpticWise BrandScript Voice Enforcement
 * 
 * Post-processing functions to ensure responses follow brand voice guidelines
 */

import { COPY_BLOCKS } from './brandscript-prompt';

/**
 * Enforce all brand voice rules on generated text
 */
export function enforceBrandVoice(text: string): string {
  let corrected = text;
  
  // 1. Ensure "digital infrastructure" (already implemented)
  corrected = enforceDigitalInfrastructure(corrected);
  
  // 2. Replace PropTech framing with strategic asset framing
  corrected = replacePropTechFraming(corrected);
  
  // 3. Ensure PPP 5C order is correct
  corrected = enforcePPP5COrder(corrected);
  
  // 4. Ensure 5S UX is correctly defined
  corrected = enforce5SUX(corrected);
  
  // 5. Replace vendor language with guide language
  corrected = replaceVendorLanguage(corrected);
  
  return corrected;
}

/**
 * Ensure "infrastructure" is always "digital infrastructure"
 */
function enforceDigitalInfrastructure(text: string): string {
  return text.replace(
    /(?<!digital\s)(?<!Digital\s)\b([Ii]nfrastructure)\b/g,
    (match, p1) => {
      if (p1[0] === 'I') {
        return 'Digital Infrastructure';
      } else {
        return 'digital infrastructure';
      }
    }
  );
}

/**
 * Replace PropTech framing with strategic asset framing
 */
function replacePropTechFraming(text: string): string {
  const replacements: Record<string, string> = {
    'PropTech stack': 'digital infrastructure platform',
    'proptech stack': 'digital infrastructure platform',
    'PropTech solution': 'digital infrastructure solution',
    'proptech solution': 'digital infrastructure solution',
    'smart building gadgets': 'building systems',
    'smart building technology': 'digital infrastructure',
    'IoT devices': 'connected building systems',
    'tech upgrade': 'digital infrastructure transformation',
    'technology stack': 'digital infrastructure platform'
  };
  
  let corrected = text;
  Object.entries(replacements).forEach(([wrong, right]) => {
    const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    corrected = corrected.replace(regex, right);
  });
  
  return corrected;
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
  const fiveCPattern = /1[.)]\s*(Clarify|Connect|Collect|Coordinate|Control).*?2[.)]\s*(Clarify|Connect|Collect|Coordinate|Control).*?3[.)]\s*(Clarify|Connect|Collect|Coordinate|Control).*?4[.)]\s*(Clarify|Connect|Collect|Coordinate|Control).*?5[.)]\s*(Clarify|Connect|Collect|Coordinate|Control)/is;
  
  const match = text.match(fiveCPattern);
  if (match) {
    const found = [match[1], match[2], match[3], match[4], match[5]];
    const foundLower = found.map(f => f.toLowerCase());
    
    // Check if order is wrong
    const isWrongOrder = foundLower.some((term, index) => term !== correctOrderLower[index]);
    
    if (isWrongOrder) {
      // Replace with correct order
      const correctedList = correctOrder.map((term, index) => 
        match[0].replace(new RegExp(`${index + 1}[.)]\s*${found[index]}`, 'i'), `${index + 1}. ${term}`)
      );
      
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
  const maxScore = 7;
  
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
