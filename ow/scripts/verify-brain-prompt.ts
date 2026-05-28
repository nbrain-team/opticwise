/**
 * Local verification (no DB) for the Brain-authoritative prompt assembly.
 * Asserts that RULES_PACK is always present and personas load only on request.
 *   cd ow && npx tsx scripts/verify-brain-prompt.ts
 */
import { generateBrandScriptPrompt } from '../lib/brandscript-prompt';
import { RULES_PACK, PERSONAS, BRAIN_CANON_META } from '../lib/brain-canon.generated';

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

const now = new Date('2026-05-28T12:00:00Z');

const ow = generateBrandScriptPrompt({ currentDate: now, author: 'opticwise' });
const bill = generateBrandScriptPrompt({ currentDate: now, author: 'bill' });
const drew = generateBrandScriptPrompt({ currentDate: now, author: 'drew' });
const ce = generateBrandScriptPrompt({ currentDate: now, author: 'bill', contentEngineMode: true });

// RULES_PACK + canon present on every voice.
check('RULES_PACK non-trivial', RULES_PACK.length > 5000);
check('canon present (opticwise)', ow.includes('OWNET BRAIN — CANON'));
check('canon present (bill)', bill.includes('OWNET BRAIN — CANON'));
check('canon present (drew)', drew.includes('OWNET BRAIN — CANON'));

// Key non-negotiables from the Brain made it into the always-on canon.
check('terminology rule present', ow.includes('data & digital infrastructure'));
check('banned-term rule present (PropTech)', ow.toLowerCase().includes('proptech'));
check('PPP 5C present', ow.includes('Clarify') && ow.includes('Control'));
check('IT vs OT stance present', ow.includes('OT'));

// Personas load ONLY when requested, and are never blended.
check('bill persona loaded on author=bill', bill.includes("BILL DOUGLAS'S VOICE") && bill.includes('Life is a gift'));
check('drew persona loaded on author=drew', drew.includes("DREW HALL'S VOICE") && drew.includes('demystify'));
check('no bill persona when opticwise', !ow.includes("BILL DOUGLAS'S VOICE"));
check('no drew persona when opticwise', !ow.includes("DREW HALL'S VOICE"));
check('bill not blended into drew', !drew.includes("BILL DOUGLAS'S VOICE"));
check('drew not blended into bill', !bill.includes("DREW HALL'S VOICE"));

// Behavioral spine.
check('artifact rule present', ow.includes('<artifact'));
check('content-engine rules only in CE mode', ce.includes('CONTENT ENGINE MODE') && !ow.includes('CONTENT ENGINE MODE'));
check('date context present', ow.includes('May 28, 2026'));

// Fallback flag.
const prevFlag = process.env.BRAIN_CANON_ENABLED;
process.env.BRAIN_CANON_ENABLED = 'false';
const legacy = generateBrandScriptPrompt({ currentDate: now, author: 'opticwise' });
process.env.BRAIN_CANON_ENABLED = prevFlag;
check('fallback flag yields legacy prompt (no Brain canon header)', !legacy.includes('OWNET BRAIN — CANON'));

console.log(`\nPersonas available: bill=${PERSONAS.bill.length > 0} drew=${PERSONAS.drew.length > 0}`);
console.log(`Canon generated at: ${BRAIN_CANON_META.generatedAt}`);
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
