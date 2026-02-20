-- Multi-user email sync: per-user data isolation

-- Add email sync fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailSyncEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastEmailSync" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailSyncStatus" TEXT;

-- Add syncUserId to GmailMessage for data isolation
ALTER TABLE "GmailMessage" ADD COLUMN IF NOT EXISTS "syncUserId" TEXT;
CREATE INDEX IF NOT EXISTS "GmailMessage_syncUserId_idx" ON "GmailMessage"("syncUserId");

-- Backfill: assign all existing emails to the admin user (Bill Douglas)
-- This ensures existing data is attributed to the correct user
UPDATE "GmailMessage" SET "syncUserId" = (
  SELECT id FROM "User" WHERE email = 'bill@opticwise.com' LIMIT 1
) WHERE "syncUserId" IS NULL;

-- Enable email sync for Bill
UPDATE "User" SET "emailSyncEnabled" = true WHERE email = 'bill@opticwise.com';
