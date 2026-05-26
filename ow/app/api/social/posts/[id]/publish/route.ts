import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureFreshToken, createPost } from "@/lib/linkedin-api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.socialPost.findUnique({
      where: { id },
      include: { socialAccount: true },
    });

    if (!existing)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (existing.status === "published")
      return NextResponse.json(
        { error: "Post is already published" },
        { status: 400 }
      );

    if (!existing.socialAccountId || !existing.socialAccount)
      return NextResponse.json(
        { error: "Post has no linked social account" },
        { status: 400 }
      );

    if (existing.platform !== "linkedin") {
      return NextResponse.json(
        { error: `Publishing for ${existing.platform} is not yet supported` },
        { status: 400 }
      );
    }

    await prisma.socialPost.update({
      where: { id },
      data: { status: "publishing" },
    });

    const accessToken = await ensureFreshToken(existing.socialAccountId);

    const platformId = existing.socialAccount.platformAccountId;
    const authorUrn = platformId.startsWith("urn:")
      ? platformId
      : existing.socialAccount.accountType === "company_page"
        ? `urn:li:organization:${platformId}`
        : `urn:li:person:${platformId}`;

    const mediaIds = existing.mediaItems
      ? (existing.mediaItems as Array<{ mediaId?: string; id?: string }>)
          .map((m) => m.mediaId || m.id)
          .filter(Boolean) as string[]
      : undefined;

    const { postUrn } = await createPost(accessToken, {
      authorUrn,
      text: existing.content,
      mediaIds: mediaIds?.length ? mediaIds : undefined,
    });

    const post = await prisma.socialPost.update({
      where: { id },
      data: {
        platformPostId: postUrn,
        status: "published",
        publishedAt: new Date(),
        errorMessage: null,
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

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Publish social post error:", error);

    const { id } = await params;
    try {
      await prisma.socialPost.update({
        where: { id },
        data: {
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Publish failed",
        },
      });
    } catch (updateErr) {
      console.error("Failed to mark post as failed:", updateErr);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish social post",
      },
      { status: 500 }
    );
  }
}
