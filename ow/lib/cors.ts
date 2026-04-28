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
  ];

  return Array.from(new Set([...fromEnv, ...defaults]));
}

/**
 * If the request Origin is allow-listed (or matches *.vercel.app for Payload
 * preview deploys), echo it back. Otherwise return null and the route should
 * NOT include any CORS headers (browser will reject).
 */
export function resolveAllowedOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  const normalized = requestOrigin.replace(/\/+$/, "");
  const list = getAllowedOrigins();
  if (list.includes(normalized)) return normalized;

  // Allow Vercel preview deploys for the Payload site by default. Tighten
  // later if needed by setting MARKETING_SITE_ORIGINS to a strict list.
  try {
    const u = new URL(normalized);
    if (u.hostname.endsWith(".vercel.app")) return normalized;
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
