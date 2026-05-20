import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { generatePostHtml, generateIndexCard } from "@/lib/blog-html-generator"
import { publishPostToGitHub } from "@/lib/github-publisher"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN is not configured" }, { status: 500 })
  }

  const publishedAt = post.publishedAt || new Date()

  const postData = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImageUrl: post.coverImageUrl || "",
    author: post.author,
    category: post.category,
    secondaryCats: post.secondaryCats,
    tags: post.tags,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    metaKeywords: post.metaKeywords,
    publishedAt,
  }

  const postHtml = generatePostHtml(postData)
  const indexCard = generateIndexCard(postData)

  const { postSha, indexSha } = await publishPostToGitHub(
    post.slug,
    postHtml,
    indexCard,
    post.title
  )

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      status: "published",
      publishedAt,
      githubSha: postSha,
      indexSha: indexSha,
    },
  })

  return NextResponse.json({
    success: true,
    url: `https://www.opticwise.com/insights/${post.slug}/`,
    post: updated,
  })
}
