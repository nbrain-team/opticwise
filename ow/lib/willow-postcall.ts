import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const PIPELINE_NAME = "Landing Pages Leads";
const STAGE_NAME = "888-OW main inbound";
const OWNER_EMAIL = "bill@opticwise.com";

export interface WillowCallData {
  conversationId: string;
  agentId?: string;
  agentName?: string;
  status?: string;
  callerPhone?: string;
  callerName?: string;
  callerCompany?: string;
  callerRole?: string;
  callReason?: string;
  callbackPreference?: string;
  contactInfo?: string;
  urgency?: string;
  transcript?: unknown;
  transcriptSummary?: string;
  callSuccessful?: string;
  startTime: Date;
  duration?: number;
  cost?: number;
  terminationReason?: string;
  rawPayload?: unknown;
}

interface CrmResult {
  personId: string | null;
  organizationId: string | null;
  dealId: string | null;
}

/**
 * Resolve pipeline + stage IDs, creating the stage if it doesn't exist yet.
 */
async function resolvePipelineStage() {
  const pipeline = await prisma.pipeline.findFirst({
    where: { name: PIPELINE_NAME },
  });
  if (!pipeline) {
    throw new Error(`Pipeline "${PIPELINE_NAME}" not found`);
  }

  let stage = await prisma.stage.findFirst({
    where: { pipelineId: pipeline.id, name: STAGE_NAME },
  });

  if (!stage) {
    const maxOrder = await prisma.stage.aggregate({
      where: { pipelineId: pipeline.id },
      _max: { orderIndex: true },
    });
    stage = await prisma.stage.create({
      data: {
        name: STAGE_NAME,
        pipelineId: pipeline.id,
        orderIndex: (maxOrder._max.orderIndex ?? 0) + 1,
      },
    });
    console.log(`[willow] Created stage "${STAGE_NAME}" in pipeline "${PIPELINE_NAME}"`);
  }

  return { pipelineId: pipeline.id, stageId: stage.id };
}

/**
 * Find-or-create Organization by company name.
 * Mirrors the pattern in lib/forms.ts.
 */
async function findOrCreateOrganization(companyName: string): Promise<string | null> {
  const name = companyName.trim();
  if (!name) return null;

  const org = await prisma.organization.upsert({
    where: { name },
    create: { name },
    update: {},
  });
  return org.id;
}

/**
 * Find-or-create Person, preferring phone match, then name + org match.
 * Voice callers rarely provide email, so phone is the primary key.
 */
async function findOrCreatePerson(
  callerName: string | undefined,
  callerPhone: string | undefined,
  contactInfo: string | undefined,
  organizationId: string | null
): Promise<string | null> {
  const phone = callerPhone?.trim() || null;
  const email = extractEmail(contactInfo);
  const { firstName, lastName } = splitName(callerName);

  if (!phone && !email && !firstName) return null;

  // 1. Try email match (Person.email is unique)
  let existing = email ? await prisma.person.findUnique({ where: { email } }) : null;

  // 2. Try phone match
  if (!existing && phone) {
    existing = await prisma.person.findFirst({
      where: {
        OR: [
          { phone },
          { phoneMobile: phone },
          { phoneWork: phone },
        ],
      },
    });
  }

  // 3. Try name + org match
  if (!existing && (firstName || lastName) && organizationId) {
    existing = await prisma.person.findFirst({
      where: { firstName: firstName || "", lastName: lastName || "", organizationId },
    });
  }

  if (existing) {
    const update: Prisma.PersonUpdateInput = {};
    if (firstName && !existing.firstName) update.firstName = firstName;
    if (lastName && !existing.lastName) update.lastName = lastName;
    if (phone && !existing.phone) update.phone = phone;
    if (email && !existing.email) update.email = email;
    if (organizationId && !existing.organizationId) {
      update.organization = { connect: { id: organizationId } };
    }
    if (Object.keys(update).length > 0) {
      await prisma.person.update({ where: { id: existing.id }, data: update });
    }
    return existing.id;
  }

  const created = await prisma.person.create({
    data: {
      firstName: firstName || (phone ?? "Unknown"),
      lastName: lastName || "",
      name: callerName?.trim() || phone || "Unknown caller",
      email: email ?? null,
      phone,
      organizationId: organizationId ?? undefined,
    },
  });
  return created.id;
}

/**
 * Process a completed Willow call: upsert the call record and create CRM entities.
 */
export async function processWillowCall(data: WillowCallData): Promise<CrmResult> {
  const toJson = (val: unknown): Prisma.InputJsonValue =>
    val == null
      ? (Prisma.DbNull as unknown as Prisma.InputJsonValue)
      : JSON.parse(JSON.stringify(val));

  // Upsert VoiceAgentCall
  const call = await prisma.voiceAgentCall.upsert({
    where: { conversationId: data.conversationId },
    update: {
      agentId: data.agentId ?? null,
      agentName: data.agentName ?? null,
      status: data.status ?? null,
      callerPhone: data.callerPhone ?? null,
      callerName: data.callerName ?? null,
      callerCompany: data.callerCompany ?? null,
      callerRole: data.callerRole ?? null,
      callReason: data.callReason ?? null,
      callbackPreference: data.callbackPreference ?? null,
      contactInfo: data.contactInfo ?? null,
      urgency: data.urgency ?? null,
      transcript: toJson(data.transcript),
      transcriptSummary: data.transcriptSummary ?? null,
      callSuccessful: data.callSuccessful ?? null,
      startTime: data.startTime,
      duration: data.duration ?? null,
      cost: data.cost ?? null,
      terminationReason: data.terminationReason ?? null,
      rawPayload: toJson(data.rawPayload),
    },
    create: {
      conversationId: data.conversationId,
      agentId: data.agentId ?? null,
      agentName: data.agentName ?? null,
      status: data.status ?? null,
      callerPhone: data.callerPhone ?? null,
      callerName: data.callerName ?? null,
      callerCompany: data.callerCompany ?? null,
      callerRole: data.callerRole ?? null,
      callReason: data.callReason ?? null,
      callbackPreference: data.callbackPreference ?? null,
      contactInfo: data.contactInfo ?? null,
      urgency: data.urgency ?? null,
      transcript: toJson(data.transcript),
      transcriptSummary: data.transcriptSummary ?? null,
      callSuccessful: data.callSuccessful ?? null,
      startTime: data.startTime,
      duration: data.duration ?? null,
      cost: data.cost ?? null,
      terminationReason: data.terminationReason ?? null,
      rawPayload: toJson(data.rawPayload),
    },
  });

  console.log("[willow] Upserted VoiceAgentCall:", call.id);

  // CRM creation (best-effort — failures logged, not re-thrown)
  let personId: string | null = null;
  let organizationId: string | null = null;
  let dealId: string | null = null;

  try {
    organizationId = await findOrCreateOrganization(data.callerCompany ?? "");
    personId = await findOrCreatePerson(
      data.callerName,
      data.callerPhone,
      data.contactInfo,
      organizationId
    );

    const { pipelineId, stageId } = await resolvePipelineStage();

    const owner = await prisma.user.findFirst({ where: { email: OWNER_EMAIL } });
    if (!owner) {
      console.error(`[willow] Owner "${OWNER_EMAIL}" not found — deal will have no owner`);
    }

    const callerLabel = data.callerName?.trim() || data.callerPhone || "Unknown";
    const companyLabel = data.callerCompany?.trim() || "";
    const dealTitle = companyLabel
      ? `Willow Call: ${callerLabel} - ${companyLabel}`
      : `Willow Call: ${callerLabel}`;

    const maxPos = await prisma.deal.aggregate({
      where: { stageId, pipelineId },
      _max: { position: true },
    });

    const deal = await prisma.deal.create({
      data: {
        title: dealTitle,
        value: 0,
        currency: "USD",
        pipelineId,
        stageId,
        position: (maxPos._max.position ?? 0) + 1,
        organizationId: organizationId ?? undefined,
        personId: personId ?? undefined,
        ownerId: owner?.id ?? "",
        leadSource: "Willow Voice Agent",
        sourceChannel: "phone_call",
        sourceChannelId: data.conversationId,
        customFields: {
          _source: "willow-postcall",
          callReason: data.callReason ?? null,
          callbackPreference: data.callbackPreference ?? null,
          urgency: data.urgency ?? null,
          callerRole: data.callerRole ?? null,
          transcriptSummary: data.transcriptSummary ?? null,
        } as Prisma.InputJsonValue,
      },
    });
    dealId = deal.id;

    // DealContact stakeholder
    if (personId) {
      await prisma.dealContact.upsert({
        where: { dealId_personId: { dealId: deal.id, personId } },
        create: {
          dealId: deal.id,
          personId,
          isPrimary: true,
          role: null,
          notes: "Auto-added from Willow voice call",
        },
        update: {},
      }).catch((err) => console.error("[willow] DealContact upsert failed:", err));
    }

    // Note — surfaces call details prominently on the deal's Notes tab
    const noteLines: string[] = [
      `📞 Inbound call via Willow Voice Agent`,
      ``,
      `Caller: ${data.callerName?.trim() || "Unknown"}`,
    ];
    if (data.callerCompany) noteLines.push(`Company: ${data.callerCompany}`);
    if (data.callerRole) noteLines.push(`Role: ${data.callerRole}`);
    if (data.callerPhone) noteLines.push(`Phone: ${data.callerPhone}`);
    if (data.contactInfo) noteLines.push(`Contact info: ${data.contactInfo}`);
    if (data.callbackPreference) noteLines.push(`Callback preference: ${data.callbackPreference}`);
    if (data.urgency) noteLines.push(`Urgency: ${data.urgency}`);
    noteLines.push(``);
    if (data.callReason) {
      noteLines.push(`What did the caller ask?`);
      noteLines.push(data.callReason);
      noteLines.push(``);
    }
    if (data.transcriptSummary) {
      noteLines.push(`Call summary:`);
      noteLines.push(data.transcriptSummary);
    }

    await prisma.note.create({
      data: {
        content: noteLines.join("\n"),
        dealId: deal.id,
        personId: personId ?? undefined,
        organizationId: organizationId ?? undefined,
        createdBy: "Willow Voice Agent",
      },
    });

    // Activity log
    await prisma.activity.create({
      data: {
        subject: `Willow call: ${callerLabel}`,
        note: data.transcriptSummary || data.callReason || "Inbound call via Willow voice agent",
        type: "call",
        status: "done",
        doneTime: new Date(),
        dealId: deal.id,
        personId: personId ?? undefined,
        organizationId: organizationId ?? undefined,
        assignedTo: OWNER_EMAIL,
        createdBy: "Willow Voice Agent",
      },
    });

    // Update VoiceAgentCall with CRM links
    await prisma.voiceAgentCall.update({
      where: { id: call.id },
      data: { personId, organizationId, dealId },
    });

    console.log("[willow] CRM created — deal:", dealId, "person:", personId, "org:", organizationId);
  } catch (err) {
    console.error("[willow] CRM creation failed (non-fatal):", err);
  }

  return { personId, organizationId, dealId };
}

function splitName(fullName?: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function extractEmail(contactInfo?: string): string | null {
  if (!contactInfo) return null;
  const match = contactInfo.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}
