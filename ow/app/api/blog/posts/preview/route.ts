import { NextRequest, NextResponse } from "next/server"
import { generatePostHtml } from "@/lib/blog-html-generator"

const PREVIEW_BANNER = `<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#f59e0b;color:#000;text-align:center;padding:8px 16px;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.02em;box-shadow:0 2px 8px rgba(0,0,0,0.15)">PREVIEW — This is how the post will appear on opticwise.com. Not yet published.</div><div style="height:40px"></div>`

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { title, slug, excerpt, content, coverImageUrl, author, category, secondaryCats, tags, metaTitle, metaDescription, metaKeywords } = body

  if (!title || !slug || !excerpt || !content) {
    return NextResponse.json({ error: "Title, slug, excerpt, and content are required" }, { status: 400 })
  }

  let html = generatePostHtml({
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

  const baseTag = `<base href="https://www.opticwise.com/insights/${slug}/">`
  html = html.replace("<head>", `<head>${baseTag}`)

  html = html.replace("<body>", `<body>${PREVIEW_BANNER}`)

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
