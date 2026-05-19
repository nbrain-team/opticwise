-- CreateTable
CREATE TABLE "SocialAccountPermission" (
    "id" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'poster',
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccountPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialAccountPermission_userId_idx" ON "SocialAccountPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccountPermission_socialAccountId_userId_key" ON "SocialAccountPermission"("socialAccountId", "userId");

-- AddForeignKey
ALTER TABLE "SocialAccountPermission" ADD CONSTRAINT "SocialAccountPermission_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccountPermission" ADD CONSTRAINT "SocialAccountPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
