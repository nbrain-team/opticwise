import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toNullIfEmpty, toInt, toDecimal, toDateOrNull } from "@/lib/api-sanitize";

const DEAL_RELATION_KEYS = [
  "addTime", "updateTime", "pipeline", "stage", "organization", "person", "owner",
  "dealContacts", "emailThreads", "callTranscripts", "gmailMessages",
  "calendarEvents", "driveFiles", "noteRecords", "notes", "activities",
  "campaignLeadsConverted", "auditRequestsConverted", "bookRequestsConverted",
  "conferenceAttendeesConverted", "chatbotConversationsConverted",
  "id", "pipelineId", "ownerId", "position", "stageChangeTime", "customFields",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.stageId !== undefined) updateData.stageId = body.stageId;
    if (body.label !== undefined) updateData.label = toNullIfEmpty(body.label);
    if (body.labels !== undefined) updateData.labels = toNullIfEmpty(body.labels);
    if (body.lostReason !== undefined) updateData.lostReason = toNullIfEmpty(body.lostReason);

    // Foreign key fields: empty string → null
    if (body.organizationId !== undefined) updateData.organizationId = toNullIfEmpty(body.organizationId);
    if (body.personId !== undefined) updateData.personId = toNullIfEmpty(body.personId);

    // Integer field
    if (body.probability !== undefined) updateData.probability = toInt(body.probability);

    // Decimal fields
    if (body.value !== undefined) updateData.value = toDecimal(body.value) ?? 0;
    if (body.productAmount !== undefined) updateData.productAmount = toDecimal(body.productAmount);
    if (body.mrr !== undefined) updateData.mrr = toDecimal(body.mrr);
    if (body.arr !== undefined) updateData.arr = toDecimal(body.arr);
    if (body.acv !== undefined) updateData.acv = toDecimal(body.acv);
    if (body.arrForecast !== undefined) updateData.arrForecast = toDecimal(body.arrForecast);
    if (body.capexRom !== undefined) updateData.capexRom = toDecimal(body.capexRom);
    if (body.auditValue !== undefined) updateData.auditValue = toDecimal(body.auditValue);
    if (body.arrExpansionPotential !== undefined) updateData.arrExpansionPotential = toDecimal(body.arrExpansionPotential);

    // Date fields
    if (body.expectedCloseDate !== undefined) updateData.expectedCloseDate = toDateOrNull(body.expectedCloseDate);
    if (body.wonTime !== undefined) updateData.wonTime = toDateOrNull(body.wonTime);
    if (body.lostTime !== undefined) updateData.lostTime = toDateOrNull(body.lostTime);
    if (body.nextActivityDate !== undefined) updateData.nextActivityDate = toDateOrNull(body.nextActivityDate);
    if (body.lastActivityDate !== undefined) updateData.lastActivityDate = toDateOrNull(body.lastActivityDate);
    if (body.lastEmailReceived !== undefined) updateData.lastEmailReceived = toDateOrNull(body.lastEmailReceived);
    if (body.lastEmailSent !== undefined) updateData.lastEmailSent = toDateOrNull(body.lastEmailSent);

    // Nullable string fields
    const nullableStringFields = [
      "propertyAddress", "propertyType", "qty", "goLiveTarget",
      "productQuantity", "productName", "mrrCurrency", "arrCurrency", "acvCurrency",
      "arrForecastCurrency", "capexRomCurrency", "auditValueCurrency", "arrExpansionCurrency",
      "sourceOrigin", "sourceOriginId", "sourceChannel", "sourceChannelId",
      "roiNoiBomSheet", "printsPlansExternal", "printsPlansDropbox",
      "leadSource", "technicalPOC", "icpSegment", "leadSourcePPP",
      "readinessScore", "ddiAuditStatus",
    ];
    for (const field of nullableStringFields) {
      if (body[field] !== undefined) updateData[field] = toNullIfEmpty(body[field]);
    }

    // Nullable int fields
    const nullableIntFields = [
      "totalActivities", "doneActivities", "activitiesToDo", "emailMessagesCount",
    ];
    for (const field of nullableIntFields) {
      if (body[field] !== undefined) updateData[field] = toInt(body[field]);
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        pipeline: true,
        stage: true,
        organization: true,
        person: true,
        owner: true,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    await prisma.deal.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Deal deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete deal" },
      { status: 500 }
    );
  }
}
