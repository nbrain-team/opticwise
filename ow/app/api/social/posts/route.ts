import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SocialPlatform, SocialPostStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as SocialPostStatus | null;
    const platform = searchParams.get("platform") as SocialPlatform | null;
    const accountId = searchParams.get("accountId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("perPage") ?? "25"))
    );

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (accountId) where.socialAccountId = accountId;

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        include: {
          socialAccount: {
            select: {
              id: true,
              displayName: true,
              platform: true,
              accountType: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.socialPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("List social posts error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list social posts",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      socialAccountId,
      content,
      firstComment,
      mediaItems,
      mediaType,
      scheduledFor,
      timezone = "America/Denver",
      aiGenerated = false,
      aiPrompt,
      aiTopicCategory,
    } = body;

    if (!content || !socialAccountId) {
      return NextResponse.json(
        { error: "content and socialAccountId are required" },
        { status: 400 }
      );
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
    });
    if (!account)
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );

    const post = await prisma.socialPost.create({
      data: {
        socialAccountId,
        platform: account.platform,
        content,
        firstComment,
        mediaItems,
        mediaType,
        status: "draft",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        timezone,
        aiGenerated,
        aiPrompt,
        aiTopicCategory,
        createdBy: session.email,
      },
      include: {
        socialAccount: {
          select: {
            id: true,
            displayName: true,
            platform: true,
            accountType: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create social post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create social post",
      },
      { status: 500 }
    );
  }
}
