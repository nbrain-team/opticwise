import { NextRequest, NextResponse } from "next/server";
import { getFormBySlugWithFields } from "@/lib/forms";
import { corsHeaders, preflightResponse, resolveAllowedOrigin } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request.headers.get("origin"));
}

/**
 * Returns the public-safe definition of a form. Never exposes pipelineId,
 * stageId, or ownerId — those are routing internals. The marketing site only
 * needs labels, types, options, and the honeypot field name.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const allowedOrigin = resolveAllowedOrigin(request.headers.get("origin"));
  const headers = corsHeaders(allowedOrigin);

  const { slug } = await context.params;
  const form = await getFormBySlugWithFields(slug);
  if (!form || !form.isActive) {
    return NextResponse.json({ error: "Form not found" }, { status: 404, headers });
  }

  return NextResponse.json(
    {
      form: {
        id: form.id,
        slug: form.slug,
        name: form.name,
        description: form.description,
        submitButtonLabel: form.submitButtonLabel,
        successMessage: form.successMessage,
        honeypotFieldName: form.honeypotFieldName,
        fields: form.fields.map((f) => ({
          id: f.id,
          label: f.label,
          fieldKey: f.fieldKey,
          fieldType: f.fieldType,
          required: f.required,
          placeholder: f.placeholder,
          helpText: f.helpText,
          options: f.options,
        })),
      },
    },
    { headers }
  );
}
