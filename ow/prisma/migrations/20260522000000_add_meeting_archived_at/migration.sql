-- AlterTable
ALTER TABLE "ReadAIMeeting" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ReadAIMeeting_archivedAt_idx" ON "ReadAIMeeting"("archivedAt");
