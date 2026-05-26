import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function authEngine(req: NextRequest): boolean {
  const token = process.env.CONTENT_ENGINE_API_TOKEN
  if (!token) return false
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

const PROFILE_TO_DISPLAY: Record<string, string> = {
  "linkedin:bill-douglas": "Bill Douglas",
  "linkedin:drew-hall": "Drew Hall",
}

export async function POST(req: NextRequest) {
  if (!authEngine(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const idempotencyKey = req.headers.get("idempotency-key")
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency-Key header required" },
      { status: 400 },
    )
  }

  try {
    const body = await req.json()

    const requiredFields = [
      "author", "channel", "target_profile", "text", "publish_at", "run_id",
    ]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        )
      }
    }

    const publishAt = new Date(body.publish_at)
    if (isNaN(publishAt.getTime())) {
      return NextResponse.json({ error: "Invalid publish_at date" }, { status: 400 })
    }

    // Resolve the SocialAccount for the target profile
    const displayName = PROFILE_TO_DISPLAY[body.target_profile]
    let socialAccountId: string | null = null

    if (displayName) {
      const account = await prisma.socialAccount.findFirst({
        where: {
          platform: "linkedin",
          isConnected: true,
          OR: [
            { displayName: { contains: displayName, mode: "insensitive" } },
            { username: { contains: body.author, mode: "insensitive" } },
          ],
        },
      })
      socialAccountId = account?.id ?? null
    }

    const hashtagText = (body.hashtags || [])
      .map((h: string) => (h.startsWith("#") ? h : `#${h}`))
      .join(" ")
    const fullContent = `${body.text}\n\n${hashtagText}`.trim()

    const post = await prisma.socialPost.create({
      data: {
        socialAccountId,
        platform: "linkedin",
        status: "scheduled",
        content: fullContent,
        scheduledFor: publishAt,
        timezone: "America/Denver",
        aiGenerated: true,
        aiTopicCategory: `content-engine:${body.run_id}`,
        createdBy: `content-engine:${body.author}`,
      },
    })

    return NextResponse.json({
      social_post_id: post.id,
      status: "scheduled",
      publish_at: post.scheduledFor?.toISOString(),
      channel: "linkedin",
      target_profile: body.target_profile,
      edit_url: `https://ownet.opticwise.com/social?post=${post.id}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("social/compose POST error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
