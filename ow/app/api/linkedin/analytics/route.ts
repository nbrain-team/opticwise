import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import * as zernio from '@/lib/zernio';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = searchParams.get('toDate') ?? new Date().toISOString().split('T')[0];

    const accounts = await prisma.linkedInAccount.findMany({
      where: { isConnected: true },
    });

    let zernioAnalytics: zernio.ZernioAnalytics | null = null;
    if (accounts.length > 0) {
      try {
        zernioAnalytics = await zernio.getAnalytics({
          platform: 'linkedin',
          fromDate,
          toDate,
          accountId: accounts[0].zernioAccountId,
        });
      } catch (zErr) {
        console.error('Zernio analytics error:', zErr);
      }
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const posts = await prisma.socialPost.findMany({
      where: {
        status: 'published',
        publishedAt: { gte: from, lte: to },
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        content: true,
        publishedAt: true,
        impressions: true,
        likes: true,
        commentCount: true,
        shares: true,
        clicks: true,
        reach: true,
        aiGenerated: true,
      },
    });

    const totalPosts = posts.length;
    const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.commentCount, 0);
    const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);
    const totalClicks = posts.reduce((sum, p) => sum + p.clicks, 0);
    const totalReach = posts.reduce((sum, p) => sum + p.reach, 0);
    const engagementRate = totalImpressions > 0
      ? ((totalLikes + totalComments + totalShares + totalClicks) / totalImpressions * 100).toFixed(2)
      : '0';

    const scheduledCount = await prisma.socialPost.count({ where: { status: 'scheduled' } });
    const draftCount = await prisma.socialPost.count({ where: { status: 'draft' } });

    return NextResponse.json({
      summary: {
        totalPosts,
        scheduledCount,
        draftCount,
        totalImpressions,
        totalLikes,
        totalComments,
        totalShares,
        totalClicks,
        totalReach,
        engagementRate: parseFloat(engagementRate),
      },
      posts,
      zernioAnalytics,
      dateRange: { fromDate, toDate },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
