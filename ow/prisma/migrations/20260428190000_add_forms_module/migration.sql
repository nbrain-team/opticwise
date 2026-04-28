-- =====================
-- Forms-to-CRM bridge
-- Form authoring + public submission intake that creates Org + Person + Deal
-- =====================

-- CreateEnum: FormFieldType
DO $$ BEGIN
  CREATE TYPE "FormFieldType" AS ENUM (
    'text', 'email', 'tel', 'textarea', 'select', 'radio', 'checkbox', 'number', 'url', 'date'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum: FormFieldMapping
DO $$ BEGIN
  CREATE TYPE "FormFieldMapping" AS ENUM (
    'person_firstName', 'person_lastName', 'person_email', 'person_phone', 'person_title',
    'organization_name', 'organization_websiteUrl', 'organization_domain',
    'deal_notes'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum: FormSubmissionStatus
DO $$ BEGIN
  CREATE TYPE "FormSubmissionStatus" AS ENUM ('processed', 'failed', 'spam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable: Form
CREATE TABLE IF NOT EXISTS "Form" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "pipelineId" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "dealTitleTemplate" TEXT NOT NULL DEFAULT '{formName} — {firstName} {lastName} @ {company}',
  "submitButtonLabel" TEXT NOT NULL DEFAULT 'Submit',
  "successMessage" TEXT NOT NULL DEFAULT 'Thanks — we''ll be in touch shortly.',
  "honeypotFieldName" TEXT NOT NULL DEFAULT 'website_url_extra',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Form_slug_key" ON "Form"("slug");
CREATE INDEX IF NOT EXISTS "Form_slug_idx" ON "Form"("slug");
CREATE INDEX IF NOT EXISTS "Form_isActive_idx" ON "Form"("isActive");
CREATE INDEX IF NOT EXISTS "Form_ownerId_idx" ON "Form"("ownerId");

-- AddForeignKey: Form → Pipeline / Stage / Owner / CreatedBy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Form_pipelineId_fkey') THEN
    ALTER TABLE "Form" ADD CONSTRAINT "Form_pipelineId_fkey"
      FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Form_stageId_fkey') THEN
    ALTER TABLE "Form" ADD CONSTRAINT "Form_stageId_fkey"
      FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Form_ownerId_fkey') THEN
    ALTER TABLE "Form" ADD CONSTRAINT "Form_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Form_createdById_fkey') THEN
    ALTER TABLE "Form" ADD CONSTRAINT "Form_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable: FormField
CREATE TABLE IF NOT EXISTS "FormField" (
  "id" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "label" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "fieldType" "FormFieldType" NOT NULL DEFAULT 'text',
  "required" BOOLEAN NOT NULL DEFAULT false,
  "placeholder" TEXT,
  "helpText" TEXT,
  "options" JSONB,
  "mapsTo" "FormFieldMapping",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FormField_formId_fieldKey_key" ON "FormField"("formId", "fieldKey");
CREATE INDEX IF NOT EXISTS "FormField_formId_orderIndex_idx" ON "FormField"("formId", "orderIndex");

-- AddForeignKey: FormField → Form
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FormField_formId_fkey') THEN
    ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formId_fkey"
      FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable: FormSubmission
CREATE TABLE IF NOT EXISTS "FormSubmission" (
  "id" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "rawData" JSONB NOT NULL,
  "status" "FormSubmissionStatus" NOT NULL DEFAULT 'processed',
  "errorMessage" TEXT,
  "personId" TEXT,
  "organizationId" TEXT,
  "dealId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "referrer" TEXT,
  "pageUrl" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmTerm" TEXT,
  "utmContent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FormSubmission_formId_createdAt_idx" ON "FormSubmission"("formId", "createdAt");
CREATE INDEX IF NOT EXISTS "FormSubmission_status_idx" ON "FormSubmission"("status");
CREATE INDEX IF NOT EXISTS "FormSubmission_dealId_idx" ON "FormSubmission"("dealId");
CREATE INDEX IF NOT EXISTS "FormSubmission_personId_idx" ON "FormSubmission"("personId");

-- AddForeignKey: FormSubmission → Form / Person / Organization / Deal
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FormSubmission_formId_fkey') THEN
    ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formId_fkey"
      FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FormSubmission_personId_fkey') THEN
    ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_personId_fkey"
      FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FormSubmission_organizationId_fkey') THEN
    ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FormSubmission_dealId_fkey') THEN
    ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_dealId_fkey"
      FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
