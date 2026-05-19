-- 4.13 Social Posting Tool: new multi-platform social media schema
-- Adds SocialAccount, DeliverableSchedule models; extends SocialPost with
-- platform-aware fields, risk classification, and approval workflow.

-- Enums
CREATE TYPE "SocialPlatform" AS ENUM ('linkedin', 'instagram');
CREATE TYPE "SocialPostStatus" AS ENUM ('draft', 'pending_approval', 'scheduled', 'publishing', 'published', 'failed', 'rejected');
CREATE TYPE "RiskTier" AS ENUM ('low', 'high');

-- SocialAccount (replaces LinkedInAccount for new code)
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'personal',
    "displayName" TEXT,
    "username" TEXT,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "tokenScope" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "autoPublishEnabled" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialAccount_platform_platformAccountId_key" ON "SocialAccount"("platform", "platformAccountId");
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");
CREATE INDEX "SocialAccount_isConnected_idx" ON "SocialAccount"("isConnected");
CREATE INDEX "SocialAccount_userId_idx" ON "SocialAccount"("userId");

ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Extend SocialPost: add new columns
ALTER TABLE "SocialPost" ADD COLUMN "platformPostId" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "socialAccountId" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "platform" "SocialPlatform" NOT NULL DEFAULT 'linkedin';
ALTER TABLE "SocialPost" ADD COLUMN "riskTier" "RiskTier";
ALTER TABLE "SocialPost" ADD COLUMN "riskReason" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "SocialPost" ADD COLUMN "rejectedBy" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "SocialPost" ADD COLUMN "rejectReason" TEXT;

-- Migrate status from String to enum: add new column, copy, drop old, rename
ALTER TABLE "SocialPost" RENAME COLUMN "status" TO "status_old";
ALTER TABLE "SocialPost" ADD COLUMN "status" "SocialPostStatus" NOT NULL DEFAULT 'draft';

UPDATE "SocialPost" SET "status" = CASE
    WHEN "status_old" = 'draft' THEN 'draft'::"SocialPostStatus"
    WHEN "status_old" = 'scheduled' THEN 'scheduled'::"SocialPostStatus"
    WHEN "status_old" = 'published' THEN 'published'::"SocialPostStatus"
    WHEN "status_old" = 'failed' THEN 'failed'::"SocialPostStatus"
    ELSE 'draft'::"SocialPostStatus"
END;

ALTER TABLE "SocialPost" DROP COLUMN "status_old";

-- Make accountId optional (was required, now deprecated)
ALTER TABLE "SocialPost" ALTER COLUMN "accountId" DROP NOT NULL;

-- Indexes on new SocialPost columns
CREATE UNIQUE INDEX "SocialPost_platformPostId_key" ON "SocialPost"("platformPostId");
CREATE INDEX "SocialPost_socialAccountId_idx" ON "SocialPost"("socialAccountId");
CREATE INDEX "SocialPost_platform_idx" ON "SocialPost"("platform");
CREATE INDEX "SocialPost_riskTier_status_idx" ON "SocialPost"("riskTier", "status");

ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DeliverableSchedule
CREATE TABLE "DeliverableSchedule" (
    "id" TEXT NOT NULL,
    "deliverableType" TEXT NOT NULL,
    "targetAccountId" TEXT NOT NULL,
    "cadence" JSONB NOT NULL,
    "defaultPostTime" TEXT NOT NULL DEFAULT '08:00',
    "timezone" TEXT NOT NULL DEFAULT 'America/Denver',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeliverableSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliverableSchedule_deliverableType_targetAccountId_key" ON "DeliverableSchedule"("deliverableType", "targetAccountId");
CREATE INDEX "DeliverableSchedule_isActive_idx" ON "DeliverableSchedule"("isActive");

ALTER TABLE "DeliverableSchedule" ADD CONSTRAINT "DeliverableSchedule_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
