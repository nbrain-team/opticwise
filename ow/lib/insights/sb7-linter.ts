/**
 * Soft warnings for marketing site SB7 canon — insights are partially exempt,
 * but surfacing nudges helps authors avoid accidental brand drift.
 */
export type Sb7LintResult = { warnings: string[] };

export function lintInsightMarkdownLite(html: string): Sb7LintResult {
  const warnings: string[] = [];
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = text.toLowerCase();

  const opticNearPropTech =
    /optic\s*wise[^.]{0,120}proptech|proptech[^.]{0,120}optic\s*wise/i.test(
      text
    );
  if (opticNearPropTech) {
    warnings.push(
      "Avoid calling OpticWise “PropTech” — OpticWise is not labeled that way on the marketing site."
    );
  }

  if (/\breit\b/i.test(text)) {
    warnings.push('Prefer “owner” instead of “REIT” when the marketing site means the buyer lens.');
  }

  if (/\besg\b/i.test(text)) {
    warnings.push(
      "Marketing pages use “operations / utilities optimization” instead of “ESG” — consider whether that framing fits this Insight."
    );
  }

  const auditOutsideTrademark =
    /\baudit\b/i.test(text) && !/\bpp\s*audit\b/i.test(lower);
  if (auditOutsideTrademark) {
    warnings.push(
      'If you mean the OpticWise engagement, “review” is the default word; keep “PPP Audit™” when naming the trademarked offer.'
    );
  }

  if (!lower.includes("data") || !lower.includes("digital")) {
    warnings.push(
      'Consider working in “data & digital infrastructure” where it fits — it’s the default marketing phrase.'
    );
  }

  return { warnings };
}
