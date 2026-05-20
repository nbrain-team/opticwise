import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const posts = await prisma.blogPost.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      status: true,
      scheduledFor: true,
      publishedAt: true,
      coverImageUrl: true,
      author: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    title,
    slug,
    excerpt,
    content,
    coverImageUrl,
    author,
    category,
    secondaryCats,
    tags,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = body

  if (!title || !slug || !excerpt || !content) {
    return NextResponse.json({ error: "title, slug, excerpt, and content are required" }, { status: 400 })
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 })
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      coverImageUrl: coverImageUrl || null,
      author: author || "Bill Douglas",
      category: category || "Building Intelligence",
      secondaryCats: secondaryCats || null,
      tags: tags || [],
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      status: "draft",
    },
  })

  return NextResponse.json(post, { status: 201 })
}
