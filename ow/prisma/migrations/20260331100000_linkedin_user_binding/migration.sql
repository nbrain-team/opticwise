-- AlterTable: Add userId and profileUrl to LinkedInAccount
ALTER TABLE "LinkedInAccount" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "LinkedInAccount" ADD COLUMN IF NOT EXISTS "profileUrl" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LinkedInAccount_userId_idx" ON "LinkedInAccount"("userId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LinkedInAccount_userId_fkey'
  ) THEN
    ALTER TABLE "LinkedInAccount"
      ADD CONSTRAINT "LinkedInAccount_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
