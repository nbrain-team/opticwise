-- Web Pages table for scraped and vectorized website content
CREATE TABLE IF NOT EXISTS "WebPage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "slug" TEXT,
    "title" TEXT,
    "metaDescription" TEXT,
    "content" TEXT,
    "headings" JSONB,
    "lastModified" TIMESTAMP(3),
    "changeFreq" TEXT,
    "vectorized" BOOLEAN NOT NULL DEFAULT false,
    "embedding" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "scrapeStatus" TEXT DEFAULT 'pending',
    "scrapeError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebPage_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "WebPage_url_key" ON "WebPage"("url");
CREATE INDEX IF NOT EXISTS "WebPage_url_idx" ON "WebPage"("url");
CREATE INDEX IF NOT EXISTS "WebPage_vectorized_idx" ON "WebPage"("vectorized");
CREATE INDEX IF NOT EXISTS "WebPage_scrapeStatus_idx" ON "WebPage"("scrapeStatus");
CREATE INDEX IF NOT EXISTS "WebPage_scrapedAt_idx" ON "WebPage"("scrapedAt");



