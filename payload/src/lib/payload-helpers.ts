import { getPayload } from "payload";
import config from "@payload-config";

let cachedPayload: Awaited<ReturnType<typeof getPayload>> | null = null;

export async function getPayloadClient() {
  if (cachedPayload) return cachedPayload;
  cachedPayload = await getPayload({ config });
  return cachedPayload;
}

export async function getHomePage() {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "pages",
      where: { isHomePage: { equals: true } },
      limit: 1,
      depth: 2,
    });
    return result.docs[0] || null;
  } catch {
    return null;
  }
}

export async function getPageBySlug(slug: string) {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "pages",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    });
    return result.docs[0] || null;
  } catch {
    return null;
  }
}

export async function getAllPages() {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "pages",
      limit: 100,
      depth: 1,
      where: { _status: { equals: "published" } },
    });
    return result.docs;
  } catch {
    return [];
  }
}

export async function getAllPosts() {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "posts",
      limit: 200,
      depth: 2,
      sort: "-publishedAt",
      where: { _status: { equals: "published" } },
    });
    return result.docs;
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "posts",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    });
    return result.docs[0] || null;
  } catch {
    return null;
  }
}

export async function getSiteSettings() {
  try {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: "site-settings", depth: 1 });
  } catch {
    return null;
  }
}

export async function getNavigation() {
  try {
    const payload = await getPayloadClient();
    return await payload.findGlobal({ slug: "navigation" });
  } catch {
    return null;
  }
}

export { getMediaUrl, getMediaAlt } from "./media-utils";
