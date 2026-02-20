-- Multi-contact deals: junction table for multiple stakeholders per deal
CREATE TABLE IF NOT EXISTS "DealContact" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DealContact_dealId_personId_key" ON "DealContact"("dealId", "personId");
CREATE INDEX IF NOT EXISTS "DealContact_dealId_idx" ON "DealContact"("dealId");
CREATE INDEX IF NOT EXISTS "DealContact_personId_idx" ON "DealContact"("personId");

ALTER TABLE "DealContact" ADD CONSTRAINT "DealContact_dealId_fkey" 
    FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealContact" ADD CONSTRAINT "DealContact_personId_fkey" 
    FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
