import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function authEngine(req: NextRequest): boolean {
  const token = process.env.CONTENT_ENGINE_API_TOKEN
  if (!token) return false
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

export async function POST(req: NextRequest) {
  if (!authEngine(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const idempotencyKey = req.headers.get("idempotency-key")
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Idempotency-Key header required" }, { status: 400 })
  }

  try {
    const body = await req.json()

    const requiredFields = [
      "author", "title", "slug", "excerpt", "body_html",
      "publish_at", "run_id",
    ]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        )
      }
    }

    const existing = await prisma.blogPost.findFirst({
      where: {
        slug: body.slug,
        status: { in: ["scheduled", "published"] },
      },
    })

    if (existing) {
      return NextResponse.json({
        scheduled_post_id: existing.id,
        status: existing.status,
        publish_at: existing.scheduledFor?.toISOString() || existing.publishedAt?.toISOString(),
        edit_url: `https://ownet.opticwise.com/blog/${existing.id}`,
        preview_url: `https://www.opticwise.com/insights/${existing.slug}/`,
      })
    }

    const publishAt = new Date(body.publish_at)
    if (isNaN(publishAt.getTime())) {
      return NextResponse.json({ error: "Invalid publish_at date" }, { status: 400 })
    }

    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.body_html,
        coverImageUrl: body.feature_image_url || null,
        author: body.author_display_name || (body.author === "bill" ? "Bill Douglas" : "Drew Hall"),
        category: body.category || "Building Intelligence",
        tags: body.tags || [],
        metaTitle: body.seo_title || body.title,
        metaDescription: body.seo_description || body.excerpt,
        status: "scheduled",
        scheduledFor: publishAt,
      },
    })

    return NextResponse.json({
      scheduled_post_id: post.id,
      status: "scheduled",
      publish_at: post.scheduledFor?.toISOString(),
      edit_url: `https://ownet.opticwise.com/blog/${post.id}`,
      preview_url: `https://www.opticwise.com/insights/${post.slug}/`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("insights/schedule POST error:", message)

    if (message.includes("Unique constraint") && message.includes("slug")) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
