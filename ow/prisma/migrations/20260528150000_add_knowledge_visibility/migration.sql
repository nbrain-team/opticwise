-- Add visibility tier to KnowledgeDocument for Brain access-control gating.
--
-- Tiers (see ow/brain/decisions/0005-access-control-tiers-for-the-brain.md):
--   shareable           -> cleared for outside audiences
--   internal            -> OpticWise team, queryable via OWnet (default)
--   internal-restricted -> principals only (Bill/Drew/Danny), excluded from
--                          general RAG queries
--
-- Existing rows (user uploads + legacy Canon — *) default to 'internal',
-- preserving current behavior.

ALTER TABLE "KnowledgeDocument"
  ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'internal';

CREATE INDEX IF NOT EXISTS "KnowledgeDocument_visibility_idx"
  ON "KnowledgeDocument" ("visibility");

COMMENT ON COLUMN "KnowledgeDocument"."visibility" IS
  'Brain access tier: shareable | internal | internal-restricted. internal-restricted is gated to principals in RAG retrieval.';
