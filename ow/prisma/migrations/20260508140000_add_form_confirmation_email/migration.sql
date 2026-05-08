-- =====================
-- Form confirmation email
-- Optionally send a templated HTML email to the form submitter on success.
-- Email is sent FROM bill@opticwise.com via the existing Gmail service account.
-- =====================

ALTER TABLE "Form"
  ADD COLUMN IF NOT EXISTS "confirmationEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "confirmationEmailSubject" TEXT,
  ADD COLUMN IF NOT EXISTS "confirmationEmailFromName" TEXT NOT NULL DEFAULT 'Bill Demas',
  ADD COLUMN IF NOT EXISTS "confirmationEmailReplyTo" TEXT,
  ADD COLUMN IF NOT EXISTS "confirmationEmailHtml" TEXT;
