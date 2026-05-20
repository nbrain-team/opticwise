import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import BlogPostForm from "./BlogPostForm"

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) notFound()

  const serialized = {
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }

  return <BlogPostForm initialPost={serialized} />
}
