import GhostContentAPI from "@tryghost/content-api";

const ghostUrl = process.env.GHOST_URL || "";
const ghostKey = process.env.GHOST_CONTENT_KEY || "";

function getApi(): GhostContentAPI | null {
  if (!ghostUrl || !ghostKey || ghostKey.length < 26) return null;
  try {
    return new GhostContentAPI({ url: ghostUrl, key: ghostKey, version: "v5.0" });
  } catch {
    return null;
  }
}

export interface GhostPost {
  id: string;
  slug: string;
  title: string;
  html: string | null;
  feature_image: string | null;
  custom_excerpt: string | null;
  excerpt: string | null;
  published_at: string | null;
  updated_at: string | null;
  tags?: { name: string; slug: string }[];
  primary_tag?: { name: string; slug: string } | null;
  reading_time?: number;
}

export interface GhostPage {
  id: string;
  slug: string;
  title: string;
  html: string | null;
  feature_image: string | null;
  custom_excerpt: string | null;
  updated_at: string | null;
}

export async function getAllPosts(): Promise<GhostPost[]> {
  const api = getApi();
  if (!api) return [];
  try {
    return await api.posts.browse({
      limit: "all",
      include: ["tags"],
      fields: "id,slug,title,html,feature_image,custom_excerpt,excerpt,published_at,updated_at,reading_time",
    }) as unknown as GhostPost[];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<GhostPost | null> {
  const api = getApi();
  if (!api) return null;
  try {
    return await api.posts.read({ slug }, { include: ["tags"] }) as unknown as GhostPost;
  } catch {
    return null;
  }
}

export async function getAllPages(): Promise<GhostPage[]> {
  const api = getApi();
  if (!api) return [];
  try {
    return await api.pages.browse({
      limit: "all",
      fields: "id,slug,title,html,feature_image,custom_excerpt,updated_at",
    }) as unknown as GhostPage[];
  } catch {
    return [];
  }
}

export async function getPageBySlug(slug: string): Promise<GhostPage | null> {
  const api = getApi();
  if (!api) return null;
  try {
    return await api.pages.read({ slug }) as unknown as GhostPage;
  } catch {
    return null;
  }
}
