import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getPostStats, ensureFreshToken } from "@/lib/linkedin-api";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const platform = searchParams.get("platform");
  const accountId = searchParams.get("accountId");
  const days = parseInt(searchParams.get("days") || "30", 10);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = {
    status: "published",
    publishedAt: { gte: since },
  };
  if (platform) where.platform = platform;
  if (accountId) where.socialAccountId = accountId;

  const posts = await prisma.socialPost.findMany({
    where,
    include: {
      socialAccount: {
        select: { id: true, displayName: true, platform: true, accountType: true, avatarUrl: true },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  const totals = {
    posts: posts.length,
    impressions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    clicks: 0,
    reach: 0,
  };

  const byAccount: Record<string, typeof totals & { account: { id: string; displayName: string | null; platform: string; accountType: string } }> = {};

  for (const post of posts) {
    totals.impressions += post.impressions;
    totals.likes += post.likes;
    totals.comments += post.commentCount;
    totals.shares += post.shares;
    totals.clicks += post.clicks;
    totals.reach += post.reach;

    if (post.socialAccount) {
      const key = post.socialAccount.id;
      if (!byAccount[key]) {
        byAccount[key] = {
          account: {
            id: post.socialAccount.id,
            displayName: post.socialAccount.displayName,
            platform: post.socialAccount.platform,
            accountType: post.socialAccount.accountType || "personal",
          },
          posts: 0,
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          reach: 0,
        };
      }
      byAccount[key].posts += 1;
      byAccount[key].impressions += post.impressions;
      byAccount[key].likes += post.likes;
      byAccount[key].comments += post.commentCount;
      byAccount[key].shares += post.shares;
      byAccount[key].clicks += post.clicks;
      byAccount[key].reach += post.reach;
    }
  }

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    totals,
    byAccount: Object.values(byAccount),
    postCount: posts.length,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { accountId } = body as { accountId?: string };

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || account.platform !== "linkedin") {
    return NextResponse.json({ error: "Only LinkedIn analytics sync is supported" }, { status: 400 });
  }

  const posts = await prisma.socialPost.findMany({
    where: {
      socialAccountId: accountId,
      status: "published",
      platformPostId: { not: null },
    },
  });

  let synced = 0;
  try {
    const token = await ensureFreshToken(accountId);
    for (const post of posts) {
      if (!post.platformPostId) continue;
      try {
        const stats = await getPostStats(token, post.platformPostId, account.platformAccountId);
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            impressions: stats.impressionCount,
            likes: stats.likeCount,
            commentCount: stats.commentCount,
            shares: stats.shareCount,
            clicks: stats.clickCount,
            reach: stats.uniqueImpressions,
          },
        });
        synced++;
      } catch {
        // Individual post stats failures are non-fatal
      }
    }
  } catch (err) {
    return NextResponse.json({
      error: "Token error — reconnect account",
      details: err instanceof Error ? err.message : String(err),
    }, { status: 401 });
  }

  return NextResponse.json({ synced, total: posts.length });
}
