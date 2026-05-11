import { NextResponse } from "next/server";

/**
 * Marketing-site origins allowed to call our public form endpoints.
 *
 * Sources:
 *   1. MARKETING_SITE_ORIGINS env var (comma-separated absolute URLs)
 *   2. Sensible defaults so the integration works out-of-the-box
 *
 * We deliberately do NOT use a wildcard. Each origin must be explicitly listed.
 */
export function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.MARKETING_SITE_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const defaults = [
    "https://opticwise.com",
    "https://www.opticwise.com",
    // Static HTML mirror of opticwise.com hosted on Render (see
    // github.com/nbrain-team/opticwise-html — deploys to
    // opticwise-html.onrender.com and any custom domain pointed at it).
    "https://opticwise-html.onrender.com",
    // peakpropertyperformance.com — host for the ppp-review form and the
    // ppp-guest-inquiry / Be on the Show form on the PPP marketing site.
    "https://www.peakpropertyperformance.com",
    "https://peakpropertyperformance.com",
    // Current Render preview URL for the PPP marketing site
    // (github.com/nbrain-team/peakperformance) while it is still
    // pre-DNS-cutover. Remove once www.peakpropertyperformance.com is live.
    "https://peakperformance.onrender.com",
  ];

  return Array.from(new Set([...fromEnv, ...defaults]));
}

/**
 * If the request Origin is allow-listed (or matches one of our preview-deploy
 * patterns), echo it back. Otherwise return null and the route should NOT
 * include any CORS headers (browser will reject).
 *
 * Preview-deploy patterns (always allowed regardless of env config):
 *   - *.vercel.app                       — Payload marketing site previews
 *   - opticwise-html-*.onrender.com      — Render PR/branch previews of the
 *                                          static HTML mirror
 */
export function resolveAllowedOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  const normalized = requestOrigin.replace(/\/+$/, "");
  const list = getAllowedOrigins();
  if (list.includes(normalized)) return normalized;

  try {
    const u = new URL(normalized);
    if (u.hostname.endsWith(".vercel.app")) return normalized;
    // Render PR / branch previews for the static HTML mirror are named
    // like `opticwise-html-pr-12.onrender.com` or
    // `opticwise-html-staging.onrender.com`. We deliberately scope this
    // to the opticwise-html service prefix — *.onrender.com on its own
    // would allow any other Render customer's app to talk to our API.
    if (
      u.hostname.endsWith(".onrender.com") &&
      u.hostname.startsWith("opticwise-html")
    ) {
      return normalized;
    }
  } catch {
    return null;
  }
  return null;
}

export function corsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) return {};
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflightResponse(requestOrigin: string | null): NextResponse {
  const allowed = resolveAllowedOrigin(requestOrigin);
  return new NextResponse(null, { status: 204, headers: corsHeaders(allowed) });
}
