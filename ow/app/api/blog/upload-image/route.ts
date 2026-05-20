import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { uploadImageToGitHub } from "@/lib/github-publisher"

export const config = {
  api: { bodyParser: false },
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN is not configured" }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const maxBytes = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 })
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF are allowed" }, { status: 415 })
  }

  // Build a clean filename: strip special chars, append timestamp to avoid collisions
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
  const filename = `${base}-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")

  const url = await uploadImageToGitHub(filename, base64)

  return NextResponse.json({ url, filename })
}
