import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureFreshToken, createPost } from "@/lib/linkedin-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.SOCIAL_CRON_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const readyPosts = await prisma.socialPost.findMany({
    where: {
      status: "scheduled",
      scheduledFor: { lte: now },
    },
    include: {
      socialAccount: true,
    },
    orderBy: { scheduledFor: "asc" },
    take: 20,
  });

  if (readyPosts.length === 0) {
    return NextResponse.json({ published: 0, failed: 0, message: "No posts due" });
  }

  let published = 0;
  let failed = 0;
  const errors: Array<{ postId: string; error: string }> = [];

  for (const post of readyPosts) {
    if (!post.socialAccount) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "failed", errorMessage: "No connected social account" },
      });
      failed++;
      errors.push({ postId: post.id, error: "No connected social account" });
      continue;
    }

    if (!post.socialAccount.isConnected) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "failed", errorMessage: "Social account disconnected" },
      });
      failed++;
      errors.push({ postId: post.id, error: "Social account disconnected" });
      continue;
    }

    // Mark as publishing to prevent double-publish
    await prisma.socialPost.update({
      where: { id: post.id },
      data: { status: "publishing" },
    });

    try {
      if (post.platform === "linkedin") {
        const token = await ensureFreshToken(post.socialAccount.id);
        const mediaIds = post.mediaItems
          ? (post.mediaItems as Array<{ mediaId?: string; id?: string }>)
              .map((m) => m.mediaId || m.id)
              .filter(Boolean) as string[]
          : undefined;

        const authorUrn = post.socialAccount.platformAccountId.startsWith("urn:")
          ? post.socialAccount.platformAccountId
          : post.socialAccount.accountType === "company_page"
            ? `urn:li:organization:${post.socialAccount.platformAccountId}`
            : `urn:li:person:${post.socialAccount.platformAccountId}`;

        const result = await createPost(token, {
          authorUrn,
          text: post.content,
          mediaIds: mediaIds?.length ? mediaIds : undefined,
        });

        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "published",
            platformPostId: result.postUrn,
            publishedAt: new Date(),
            errorMessage: null,
          },
        });
        published++;
      } else if (post.platform === "instagram") {
        // Instagram publish will be wired in Phase 4
        await prisma.socialPost.update({
          where: { id: post.id },
          data: { status: "failed", errorMessage: "Instagram publish not yet implemented" },
        });
        failed++;
        errors.push({ postId: post.id, error: "Instagram publish not yet implemented" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "failed", errorMessage: message },
      });
      failed++;
      errors.push({ postId: post.id, error: message });
    }
  }

  return NextResponse.json({ published, failed, total: readyPosts.length, errors });
}
