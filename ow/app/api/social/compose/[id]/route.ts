import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function authEngine(req: NextRequest): boolean {
  const token = process.env.CONTENT_ENGINE_API_TOKEN
  if (!token) return false
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authEngine(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const post = await prisma.socialPost.findUnique({
    where: { id },
    include: {
      socialAccount: {
        select: { displayName: true, platform: true },
      },
    },
  })

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const targetProfile = post.socialAccount?.displayName
    ? `linkedin:${post.socialAccount.displayName.toLowerCase().replace(/\s+/g, "-")}`
    : post.createdBy?.replace("content-engine:", "linkedin:") || "unknown"

  return NextResponse.json({
    social_post_id: post.id,
    status: post.status,
    publish_at: post.scheduledFor?.toISOString(),
    channel: post.platform,
    target_profile: targetProfile,
    edit_url: `https://ownet.opticwise.com/social?post=${post.id}`,
  })
}
