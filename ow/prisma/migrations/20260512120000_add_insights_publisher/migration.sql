-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('draft', 'scheduled', 'published');

-- CreateEnum
CREATE TYPE "InsightAssetKind" AS ENUM ('hero', 'og', 'inline');

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "bodyHtml" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "secondaryCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "heroImagePath" TEXT,
    "ogImagePath" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImagePath" TEXT,
    "datePublished" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "status" "InsightStatus" NOT NULL DEFAULT 'draft',
    "publishedCommitSha" TEXT,
    "readingTimeMinutes" INTEGER,
    "authorId" TEXT NOT NULL,
    "authorSlug" TEXT,
    "topicClusterPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightAsset" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "sha256" TEXT,
    "kind" "InsightAssetKind" NOT NULL DEFAULT 'inline',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Insight_slug_key" ON "Insight"("slug");

-- CreateIndex
CREATE INDEX "Insight_status_scheduledFor_idx" ON "Insight"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "Insight_authorId_idx" ON "Insight"("authorId");

-- CreateIndex
CREATE INDEX "InsightAsset_insightId_idx" ON "InsightAsset"("insightId");

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightAsset" ADD CONSTRAINT "InsightAsset_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
