-- CreateEnum for ActivityType
CREATE TYPE "ActivityType" AS ENUM ('call', 'meeting', 'task', 'deadline', 'email', 'lunch');

-- CreateEnum for ActivityStatus
CREATE TYPE "ActivityStatus" AS ENUM ('pending', 'done', 'cancelled');

-- CreateTable Note
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dealId" TEXT,
    "personId" TEXT,
    "organizationId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable Activity
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "note" TEXT,
    "type" "ActivityType" NOT NULL DEFAULT 'task',
    "status" "ActivityStatus" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "duration" INTEGER,
    "dealId" TEXT,
    "personId" TEXT,
    "organizationId" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT,
    "doneTime" TIMESTAMP(3),
    "markedAsDoneBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_dealId_idx" ON "Note"("dealId");
CREATE INDEX "Note_personId_idx" ON "Note"("personId");
CREATE INDEX "Note_organizationId_idx" ON "Note"("organizationId");
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_dealId_idx" ON "Activity"("dealId");
CREATE INDEX "Activity_personId_idx" ON "Activity"("personId");
CREATE INDEX "Activity_organizationId_idx" ON "Activity"("organizationId");
CREATE INDEX "Activity_status_idx" ON "Activity"("status");
CREATE INDEX "Activity_dueDate_idx" ON "Activity"("dueDate");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add stageChangeTime column to Deal table
ALTER TABLE "Deal" ADD COLUMN "stageChangeTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
