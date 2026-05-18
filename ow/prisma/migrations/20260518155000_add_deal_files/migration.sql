-- Sprint 2 / 3.3 — Files on deals (Postgres bytea storage + Drive link metadata).
-- See `prisma/schema.prisma` (model DealFile, DealAttachmentChunk) for the
-- shape rationale and the upload vs drive_link two-kind design.

-- CreateEnum
CREATE TYPE "DealFileKind" AS ENUM ('upload', 'drive_link');

-- CreateEnum
CREATE TYPE "DealFileExtractionStatus" AS ENUM ('not_requested', 'pending', 'indexed', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "DealFile" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "kind" "DealFileKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT,
    "content" BYTEA,
    "driveFileId" TEXT,
    "driveWebViewLink" TEXT,
    "driveThumbnailLink" TEXT,
    "driveIconLink" TEXT,
    "driveModifiedTime" TIMESTAMP(3),
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "extractionStatus" "DealFileExtractionStatus" NOT NULL DEFAULT 'not_requested',
    "extractedAt" TIMESTAMP(3),
    "extractionError" TEXT,
    "extractedTextHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealFile_dealId_idx" ON "DealFile"("dealId");

-- CreateIndex
CREATE INDEX "DealFile_uploaderId_idx" ON "DealFile"("uploaderId");

-- CreateIndex
CREATE INDEX "DealFile_kind_idx" ON "DealFile"("kind");

-- CreateIndex
CREATE INDEX "DealFile_extractionStatus_idx" ON "DealFile"("extractionStatus");

-- CreateTable
CREATE TABLE "DealAttachmentChunk" (
    "id" TEXT NOT NULL,
    "dealFileId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealAttachmentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealAttachmentChunk_dealFileId_chunkIndex_key" ON "DealAttachmentChunk"("dealFileId", "chunkIndex");

-- CreateIndex
CREATE INDEX "DealAttachmentChunk_dealId_idx" ON "DealAttachmentChunk"("dealId");

-- AddForeignKey
ALTER TABLE "DealFile" ADD CONSTRAINT "DealFile_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealFile" ADD CONSTRAINT "DealFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAttachmentChunk" ADD CONSTRAINT "DealAttachmentChunk_dealFileId_fkey" FOREIGN KEY ("dealFileId") REFERENCES "DealFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAttachmentChunk" ADD CONSTRAINT "DealAttachmentChunk_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
