import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generatePostHtml, generateIndexCard } from "@/lib/blog-html-generator"
import { publishPostToGitHub } from "@/lib/github-publisher"

function authCron(req: NextRequest): boolean {
  const secret = process.env.BLOG_CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization")
  const q = req.nextUrl.searchParams.get("secret")
  return auth === `Bearer ${secret}` || q === secret
}

async function publishDuePosts() {
  const now = new Date()
  const due = await prisma.blogPost.findMany({
    where: {
      status: "scheduled",
      scheduledFor: { lte: now },
    },
  })

  const results: { id: string; slug: string; ok: boolean; url?: string; error?: string }[] = []

  for (const post of due) {
    try {
      const publishedAt = post.publishedAt || now

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

      const { liveUrl } = await publishPostToGitHub(
        post.slug,
        postHtml,
        indexCard,
        post.title
      )

      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          status: "published",
          publishedAt,
          scheduledFor: null,
        },
      })

      results.push({ id: post.id, slug: post.slug, ok: true, url: liveUrl })
    } catch (e) {
      results.push({
        id: post.id,
        slug: post.slug,
        ok: false,
        error: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return { processed: results.length, results }
}

export async function GET(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const out = await publishDuePosts()
  return NextResponse.json(out)
}

export async function POST(req: NextRequest) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const out = await publishDuePosts()
  return NextResponse.json(out)
}
