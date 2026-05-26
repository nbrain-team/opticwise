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

  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    scheduled_post_id: post.id,
    status: post.status,
    publish_at: post.scheduledFor?.toISOString() || post.publishedAt?.toISOString(),
    slug: post.slug,
    title: post.title,
    edit_url: `https://ownet.opticwise.com/blog/${post.id}`,
    preview_url: `https://www.opticwise.com/insights/${post.slug}/`,
  })
}
