import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureFreshToken, initializeImageUpload, uploadImageBinary } from "@/lib/linkedin-api";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const socialAccountId = formData.get("socialAccountId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!socialAccountId) {
      return NextResponse.json({ error: "socialAccountId is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: jpeg, png, gif, webp.` },
        { status: 400 }
      );
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
      select: { id: true, platform: true, platformAccountId: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Social account not found" }, { status: 404 });
    }

    if (account.platform === "instagram") {
      return NextResponse.json(
        { error: "Instagram media upload not yet implemented" },
        { status: 501 }
      );
    }

    // LinkedIn image upload flow
    const token = await ensureFreshToken(account.id);
    const authorUrn = account.platformAccountId;

    const { uploadUrl, imageUrn } = await initializeImageUpload(token, authorUrn);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadImageBinary(uploadUrl, token, buffer, file.type);

    return NextResponse.json({
      mediaId: imageUrn,
      url: "",
      filename: file.name,
    });
  } catch (error) {
    console.error("Social media upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload media" },
      { status: 500 }
    );
  }
}
