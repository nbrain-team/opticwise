-- Sprint 2 / 4.7 — Meeting category classifier for ReadAIMeeting.
-- See `prisma/schema.prisma` (enum MeetingCategory) for the seven canonical
-- categories agreed in the v1 punch list: sales / client / internal /
-- vendor / executives / ppp_podcast / other.

-- CreateEnum
CREATE TYPE "MeetingCategory" AS ENUM ('sales', 'client', 'internal', 'vendor', 'executives', 'ppp_podcast', 'other');

-- AlterTable
ALTER TABLE "ReadAIMeeting"
    ADD COLUMN "category"           "MeetingCategory" DEFAULT 'other',
    ADD COLUMN "categoryConfidence" DOUBLE PRECISION,
    ADD COLUMN "categoryReason"     TEXT,
    ADD COLUMN "categorizedAt"      TIMESTAMP(3);

-- Index for category-filtered listings on the Meeting Transcripts page.
CREATE INDEX "ReadAIMeeting_category_idx" ON "ReadAIMeeting"("category");
