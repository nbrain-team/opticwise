import { getPayload } from "payload";
import config from "@payload-config";

let cachedPayload: Awaited<ReturnType<typeof getPayload>> | null = null;

export async function getPayloadClient() {
  if (cachedPayload) return cachedPayload;
  cachedPayload = await getPayload({ config });
  return cachedPayload;
}

export async function getHomePage() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    where: { isHomePage: { equals: true } },
    limit: 1,
    depth: 2,
  });
  return result.docs[0] || null;
}

export async function getPageBySlug(slug: string) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  });
  return result.docs[0] || null;
}

export async function getAllPages() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "pages",
    limit: 100,
    depth: 1,
    where: { _status: { equals: "published" } },
  });
  return result.docs;
}

export async function getAllPosts() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "posts",
    limit: 200,
    depth: 2,
    sort: "-publishedAt",
    where: { _status: { equals: "published" } },
  });
  return result.docs;
}

export async function getPostBySlug(slug: string) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "posts",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  });
  return result.docs[0] || null;
}

export async function getSiteSettings() {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "site-settings", depth: 1 });
}

export async function getNavigation() {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "navigation" });
}

export function getMediaUrl(media: any): string {
  if (!media) return "";
  if (typeof media === "string") return media;
  return media.url || "";
}

export function getMediaAlt(media: any): string {
  if (!media) return "";
  if (typeof media === "string") return "";
  return media.alt || "";
}
