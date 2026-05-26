-- ElevenLabs Voice Agent Calls (Willow post-call webhook)
CREATE TABLE "VoiceAgentCall" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,

    "agentId" TEXT,
    "agentName" TEXT,
    "status" TEXT,

    "callerPhone" TEXT,
    "callerName" TEXT,
    "callerCompany" TEXT,
    "callerRole" TEXT,
    "callReason" TEXT,
    "callbackPreference" TEXT,
    "contactInfo" TEXT,
    "urgency" TEXT,

    "transcript" JSONB,
    "transcriptSummary" TEXT,
    "callSuccessful" TEXT,

    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "cost" INTEGER,
    "terminationReason" TEXT,

    "dealId" TEXT,
    "personId" TEXT,
    "organizationId" TEXT,

    "rawPayload" JSONB,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceAgentCall_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceAgentCall_conversationId_key" ON "VoiceAgentCall"("conversationId");
CREATE INDEX "VoiceAgentCall_conversationId_idx" ON "VoiceAgentCall"("conversationId");
CREATE INDEX "VoiceAgentCall_dealId_idx" ON "VoiceAgentCall"("dealId");
CREATE INDEX "VoiceAgentCall_personId_idx" ON "VoiceAgentCall"("personId");
CREATE INDEX "VoiceAgentCall_organizationId_idx" ON "VoiceAgentCall"("organizationId");
CREATE INDEX "VoiceAgentCall_startTime_idx" ON "VoiceAgentCall"("startTime");
CREATE INDEX "VoiceAgentCall_callerPhone_idx" ON "VoiceAgentCall"("callerPhone");

ALTER TABLE "VoiceAgentCall" ADD CONSTRAINT "VoiceAgentCall_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VoiceAgentCall" ADD CONSTRAINT "VoiceAgentCall_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VoiceAgentCall" ADD CONSTRAINT "VoiceAgentCall_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
