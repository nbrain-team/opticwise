-- CreateTable
CREATE TABLE "ReadAIMeeting" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "trigger" TEXT,
    "title" TEXT NOT NULL,
    "platform" TEXT,
    "platformMeetingId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "summary" TEXT,
    "transcript" TEXT,
    "transcriptJson" JSONB,
    "actionItems" JSONB,
    "keyQuestions" JSONB,
    "topics" JSONB,
    "chapterSummaries" JSONB,
    "owner" JSONB,
    "participants" JSONB,
    "reportUrl" TEXT,
    "dealId" TEXT,
    "personId" TEXT,
    "organizationId" TEXT,
    "rawPayload" JSONB,
    "vectorized" BOOLEAN NOT NULL DEFAULT false,
    "vectorEmbedding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadAIMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadAIMeeting_sessionId_key" ON "ReadAIMeeting"("sessionId");

-- CreateIndex
CREATE INDEX "ReadAIMeeting_sessionId_idx" ON "ReadAIMeeting"("sessionId");

-- CreateIndex
CREATE INDEX "ReadAIMeeting_dealId_idx" ON "ReadAIMeeting"("dealId");

-- CreateIndex
CREATE INDEX "ReadAIMeeting_personId_idx" ON "ReadAIMeeting"("personId");

-- CreateIndex
CREATE INDEX "ReadAIMeeting_organizationId_idx" ON "ReadAIMeeting"("organizationId");

-- CreateIndex
CREATE INDEX "ReadAIMeeting_startTime_idx" ON "ReadAIMeeting"("startTime");

-- CreateIndex
CREATE INDEX "ReadAIMeeting_vectorized_idx" ON "ReadAIMeeting"("vectorized");

-- AddForeignKey
ALTER TABLE "ReadAIMeeting" ADD CONSTRAINT "ReadAIMeeting_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadAIMeeting" ADD CONSTRAINT "ReadAIMeeting_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadAIMeeting" ADD CONSTRAINT "ReadAIMeeting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
