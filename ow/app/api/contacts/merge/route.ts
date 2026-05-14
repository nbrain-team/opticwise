import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { mergeContacts } from "@/lib/contact-merge";

/**
 * POST /api/contacts/merge
 *
 * Body: { keepId: string, victimIds: string[] }
 *
 * Merges the victim Person rows into the keeper inside a single transaction.
 * See `lib/contact-merge.ts` for the full reassignment + backfill semantics.
 *
 * Auth: requires a logged-in OWnet session (any internal user). We don't
 * scope by role at this point — contact dedup is an internal admin action
 * and all current session users are internal.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const { keepId, victimIds } = body as { keepId?: unknown; victimIds?: unknown };

  if (typeof keepId !== "string" || keepId.length === 0) {
    return NextResponse.json(
      { error: "keepId must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!Array.isArray(victimIds) || victimIds.length === 0) {
    return NextResponse.json(
      { error: "victimIds must be a non-empty array" },
      { status: 400 }
    );
  }

  if (!victimIds.every((v) => typeof v === "string" && v.length > 0)) {
    return NextResponse.json(
      { error: "victimIds must be an array of non-empty strings" },
      { status: 400 }
    );
  }

  if (victimIds.length > 20) {
    return NextResponse.json(
      { error: "victimIds must contain at most 20 entries per merge" },
      { status: 400 }
    );
  }

  const result = await mergeContacts({
    keepId,
    victimIds: victimIds as string[],
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 200 });
}
