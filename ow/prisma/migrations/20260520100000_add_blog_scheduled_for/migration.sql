-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "scheduledFor" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "BlogPost_status_scheduledFor_idx" ON "BlogPost"("status", "scheduledFor");
