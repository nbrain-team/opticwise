-- CreateTable
CREATE TABLE "LinkedInAccount" (
    "id" TEXT NOT NULL,
    "zernioAccountId" TEXT NOT NULL,
    "zernioProfileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'linkedin',
    "username" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "accountType" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "zernioPostId" TEXT,
    "accountId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "firstComment" TEXT,
    "mediaItems" JSONB,
    "mediaType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'America/Denver',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "aiTopicCategory" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL,
    "zernioCommentId" TEXT,
    "postId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorUsername" TEXT,
    "authorAvatar" TEXT,
    "authorProfileUrl" TEXT,
    "content" TEXT NOT NULL,
    "isReply" BOOLEAN NOT NULL DEFAULT false,
    "parentCommentId" TEXT,
    "aiSuggestedReply" TEXT,
    "repliedWith" TEXT,
    "repliedAt" TIMESTAMP(3),
    "commentedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInAccount_zernioAccountId_key" ON "LinkedInAccount"("zernioAccountId");
CREATE INDEX "LinkedInAccount_platform_idx" ON "LinkedInAccount"("platform");
CREATE INDEX "LinkedInAccount_isConnected_idx" ON "LinkedInAccount"("isConnected");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_zernioPostId_key" ON "SocialPost"("zernioPostId");
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");
CREATE INDEX "SocialPost_scheduledFor_idx" ON "SocialPost"("scheduledFor");
CREATE INDEX "SocialPost_publishedAt_idx" ON "SocialPost"("publishedAt");
CREATE INDEX "SocialPost_accountId_idx" ON "SocialPost"("accountId");
CREATE INDEX "SocialPost_aiTopicCategory_idx" ON "SocialPost"("aiTopicCategory");

-- CreateIndex
CREATE UNIQUE INDEX "PostComment_zernioCommentId_key" ON "PostComment"("zernioCommentId");
CREATE INDEX "PostComment_postId_idx" ON "PostComment"("postId");
CREATE INDEX "PostComment_commentedAt_idx" ON "PostComment"("commentedAt");
CREATE INDEX "PostComment_parentCommentId_idx" ON "PostComment"("parentCommentId");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LinkedInAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "PostComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
