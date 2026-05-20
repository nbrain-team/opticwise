import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { deletePostFromGitHub } from "@/lib/github-publisher"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(post)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
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

  // If slug is changing, check it's not taken
  if (slug) {
    const conflict = await prisma.blogPost.findFirst({ where: { slug, NOT: { id } } })
    if (conflict) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 })
    }
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
      ...(coverImageUrl !== undefined && { coverImageUrl }),
      ...(author !== undefined && { author }),
      ...(category !== undefined && { category }),
      ...(secondaryCats !== undefined && { secondaryCats }),
      ...(tags !== undefined && { tags }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(metaKeywords !== undefined && { metaKeywords }),
    },
  })

  return NextResponse.json(post)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // If post is published, remove it from the opticwise.com website first
  if (post.status === "published" && process.env.GITHUB_TOKEN) {
    await deletePostFromGitHub(post.slug, post.title)
  }

  await prisma.blogPost.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
