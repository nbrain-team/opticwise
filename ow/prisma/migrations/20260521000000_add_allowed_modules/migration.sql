-- Add per-user module access control
ALTER TABLE "User" ADD COLUMN "allowedModules" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill existing users with all modules so nothing changes for them
UPDATE "User"
SET "allowedModules" = ARRAY[
  'deals', 'contacts', 'organizations', 'sales-inbox',
  'ownet-agent', 'cs-agent', 'social', 'meeting-transcripts',
  'conferences', 'campaigns', 'forms', 'blog',
  'content-engine', 'knowledge-base', 'audit-tool'
];
