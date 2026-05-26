const URL_REGEX = /https?:\/\/[^\s)>"]+/g;
const REF_SECTION_REGEX = /references?\s*cited/i;

export function checkBlogHyperlinks(body: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const urls = body.match(URL_REGEX) || [];

  if (urls.length === 0) {
    errors.push('Blog body contains no hyperlinks — at least 3 inline citations required');
  }

  if (!REF_SECTION_REGEX.test(body)) {
    errors.push('Blog body missing "References Cited" footer section');
  } else {
    const refSection = body.slice(body.search(REF_SECTION_REGEX));
    const refUrls = refSection.match(URL_REGEX) || [];
    const bodyWithoutRefs = body.slice(0, body.search(REF_SECTION_REGEX));
    const inlineUrls = bodyWithoutRefs.match(URL_REGEX) || [];

    for (const url of inlineUrls) {
      const domain = new URL(url).hostname;
      const inRefs = refUrls.some(r => {
        try { return new URL(r).hostname === domain; } catch { return false; }
      });
      if (!inRefs) {
        errors.push(`Inline URL ${url} not found in References Cited`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function checkNoHyperlinks(text: string, label: string): string | null {
  const urls = text.match(URL_REGEX);
  if (urls && urls.length > 0) {
    return `${label} must not contain hyperlinks, found: ${urls.join(', ')}`;
  }
  return null;
}
