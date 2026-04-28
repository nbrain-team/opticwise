import { NextRequest, NextResponse } from "next/server";
import { getFormBySlugWithFields, processFormSubmission } from "@/lib/forms";
import { corsHeaders, preflightResponse, resolveAllowedOrigin } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const allowedOrigin = resolveAllowedOrigin(request.headers.get("origin"));
  const headers = corsHeaders(allowedOrigin);

  const { slug } = await context.params;

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const form = await getFormBySlugWithFields(slug);
  if (!form || !form.isActive) {
    return NextResponse.json({ error: "Form not found" }, { status: 404, headers });
  }

  // Required-field validation against the form definition
  for (const field of form.fields) {
    if (!field.required) continue;
    const v = payload[field.fieldKey];
    const empty =
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0);
    if (empty) {
      return NextResponse.json(
        { error: `${field.label} is required.` },
        { status: 400, headers }
      );
    }
  }

  // Pull request context for attribution and audit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  // The submission body may also carry _meta with referrer/pageUrl/UTMs that
  // the browser captured at form load time.
  const meta = (payload._meta && typeof payload._meta === "object" ? payload._meta : {}) as Record<
    string,
    unknown
  >;
  delete payload._meta;

  const result = await processFormSubmission(form, payload, {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
    referrer: (meta.referrer as string | undefined) ?? request.headers.get("referer"),
    pageUrl: (meta.pageUrl as string | undefined) ?? null,
    utmSource: (meta.utmSource as string | undefined) ?? null,
    utmMedium: (meta.utmMedium as string | undefined) ?? null,
    utmCampaign: (meta.utmCampaign as string | undefined) ?? null,
    utmTerm: (meta.utmTerm as string | undefined) ?? null,
    utmContent: (meta.utmContent as string | undefined) ?? null,
  });

  if (!result.ok) {
    // For spam, we return 200 OK so bots get no signal. For real failures, 500.
    const isSpam = result.error === "Submission flagged as spam.";
    return NextResponse.json(
      isSpam
        ? { ok: true, message: form.successMessage }
        : { ok: false, error: result.error },
      { status: isSpam ? 200 : 500, headers }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: form.successMessage,
      submissionId: result.submissionId,
    },
    { status: 201, headers }
  );
}
