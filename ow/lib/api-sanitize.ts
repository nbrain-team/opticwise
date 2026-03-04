/**
 * Shared sanitization helpers for API routes.
 * Converts form data (strings, empty strings, etc.) to proper types for Prisma.
 */

export function toNullIfEmpty(v: unknown): string | null {
  if (v === "" || v === undefined || v === null) return null;
  return String(v);
}

export function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

export function toDecimal(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

export function toDateOrNull(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Strips relation objects and computed fields from a raw body object.
 * Only keeps scalar fields that Prisma can accept for an update.
 */
export function stripRelations(
  data: Record<string, unknown>,
  relationKeys: string[]
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (relationKeys.includes(key)) continue;
    if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) continue;
    if (Array.isArray(value)) continue;
    cleaned[key] = value;
  }
  return cleaned;
}
