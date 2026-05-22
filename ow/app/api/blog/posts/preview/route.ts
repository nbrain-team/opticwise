import { NextRequest, NextResponse } from "next/server"
import { generatePostHtml } from "@/lib/blog-html-generator"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { title, slug, excerpt, content, coverImageUrl, author, category, secondaryCats, tags, metaTitle, metaDescription, metaKeywords } = body

  if (!title || !slug || !excerpt || !content) {
    return NextResponse.json({ error: "Title, slug, excerpt, and content are required" }, { status: 400 })
  }

  const html = generatePostHtml({
    title,
    slug,
    excerpt,
    content,
    coverImageUrl: coverImageUrl || "",
    author: author || "Bill Douglas",
    category: category || "Building Intelligence",
    secondaryCats: secondaryCats || null,
    tags: tags || [],
    metaTitle: metaTitle || null,
    metaDescription: metaDescription || null,
    metaKeywords: metaKeywords || null,
    publishedAt: new Date(),
  })

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
