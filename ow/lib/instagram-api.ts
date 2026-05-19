/**
 * lib/instagram-api.ts — Instagram Graph API integration via Meta Business.
 *
 * Uses the container-based publishing flow:
 *   1. Create media container → 2. Publish container
 *
 * Required env vars:
 *   META_APP_ID, META_APP_SECRET
 */

import { prisma } from "@/lib/db";

const META_AUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";
const META_GRAPH_BASE = "https://graph.facebook.com/v21.0";

function env(name: string): string {
  const val = process.env[name];
  if (!val)
    throw new Error(
      `${name} is not set — add it in the Render dashboard then redeploy`
    );
  return val;
}

function getAppId(): string {
  return env("META_APP_ID");
}

function getAppSecret(): string {
  return env("META_APP_SECRET");
}

// ─── OAuth ───────────────────────────────────────────────────

const SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

export function buildInstagramAuthUrl(opts: {
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: getAppId(),
    redirect_uri: opts.redirectUri,
    state: opts.state,
    scope: SCOPES,
    response_type: "code",
  });
  return `${META_AUTH_BASE}?${params}`;
}

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export async function exchangeCodeForMetaToken(
  code: string,
  redirectUri: string
): Promise<MetaTokenResponse> {
  const params = new URLSearchParams({
    client_id: getAppId(),
    client_secret: getAppSecret(),
    redirect_uri: redirectUri,
    code,
  });
  const resp = await fetch(
    `${META_GRAPH_BASE}/oauth/access_token?${params}`
  );
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Meta token exchange failed (${resp.status}): ${body}`);
  }
  return resp.json() as Promise<MetaTokenResponse>;
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<MetaTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: getAppId(),
    client_secret: getAppSecret(),
    fb_exchange_token: shortLivedToken,
  });
  const resp = await fetch(
    `${META_GRAPH_BASE}/oauth/access_token?${params}`
  );
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(
      `Meta long-lived token exchange failed (${resp.status}): ${body}`
    );
  }
  return resp.json() as Promise<MetaTokenResponse>;
}

// ─── Account Discovery ──────────────────────────────────────

export interface InstagramAccountInfo {
  igUserId: string;
  igUsername: string;
  igName: string;
  profilePictureUrl?: string;
  pageId: string;
  pageName: string;
}

export async function discoverInstagramAccounts(
  accessToken: string
): Promise<InstagramAccountInfo[]> {
  type PageData = {
    id: string;
    name: string;
    instagram_business_account?: { id: string };
  };

  // Try standard /me/accounts first (personal page admins)
  const pagesResp = await fetch(
    `${META_GRAPH_BASE}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
  );
  let pages: PageData[] = [];
  if (pagesResp.ok) {
    const data = (await pagesResp.json()) as { data: PageData[] };
    pages = data.data || [];
  }

  console.log("[IG Discovery] /me/accounts pages:", pages.length);

  // If /me/accounts returned nothing, try via Business Manager
  if (pages.length === 0) {
    console.log("[IG Discovery] Trying Business Manager path...");
    try {
      const bizResp = await fetch(
        `${META_GRAPH_BASE}/me/businesses?fields=id,name&access_token=${accessToken}`
      );
      if (bizResp.ok) {
        const bizData = (await bizResp.json()) as {
          data: Array<{ id: string; name: string }>;
        };
        console.log("[IG Discovery] Businesses found:", bizData.data?.length);

        for (const biz of bizData.data || []) {
          const ownedResp = await fetch(
            `${META_GRAPH_BASE}/${biz.id}/owned_pages?fields=id,name,instagram_business_account&access_token=${accessToken}`
          );
          if (ownedResp.ok) {
            const ownedData = (await ownedResp.json()) as { data: PageData[] };
            console.log(
              `[IG Discovery] Business "${biz.name}" owned pages:`,
              ownedData.data?.length
            );
            pages.push(...(ownedData.data || []));
          }

          // Also check client_pages (pages managed for clients)
          const clientResp = await fetch(
            `${META_GRAPH_BASE}/${biz.id}/client_pages?fields=id,name,instagram_business_account&access_token=${accessToken}`
          );
          if (clientResp.ok) {
            const clientData = (await clientResp.json()) as { data: PageData[] };
            if (clientData.data?.length) {
              pages.push(...clientData.data);
            }
          }
        }
      }
    } catch (bizErr) {
      console.warn("[IG Discovery] Business Manager path failed:", bizErr);
    }
  }

  console.log(
    "[IG Discovery] Total pages found:",
    pages.length,
    pages.map((p) => ({
      id: p.id,
      name: p.name,
      hasIgBusiness: !!p.instagram_business_account,
    }))
  );

  const accounts: InstagramAccountInfo[] = [];

  for (const page of pages) {
    if (!page.instagram_business_account) continue;

    const igId = page.instagram_business_account.id;
    const igResp = await fetch(
      `${META_GRAPH_BASE}/${igId}?fields=username,name,profile_picture_url&access_token=${accessToken}`
    );
    if (!igResp.ok) continue;

    const ig = (await igResp.json()) as {
      username?: string;
      name?: string;
      profile_picture_url?: string;
    };

    accounts.push({
      igUserId: igId,
      igUsername: ig.username || "",
      igName: ig.name || page.name,
      profilePictureUrl: ig.profile_picture_url,
      pageId: page.id,
      pageName: page.name,
    });
  }

  return accounts;
}

// ─── Publishing ──────────────────────────────────────────────

export interface PublishImageOptions {
  igUserId: string;
  imageUrl: string;
  caption: string;
  accessToken: string;
}

export async function publishImagePost(
  opts: PublishImageOptions
): Promise<{ id: string }> {
  // Step 1: Create container
  const containerResp = await fetch(
    `${META_GRAPH_BASE}/${opts.igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: opts.imageUrl,
        caption: opts.caption,
        access_token: opts.accessToken,
      }),
    }
  );
  if (!containerResp.ok) {
    const body = await containerResp.text();
    throw new Error(`IG container creation failed (${containerResp.status}): ${body}`);
  }
  const container = (await containerResp.json()) as { id: string };

  // Step 2: Publish
  const publishResp = await fetch(
    `${META_GRAPH_BASE}/${opts.igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: opts.accessToken,
      }),
    }
  );
  if (!publishResp.ok) {
    const body = await publishResp.text();
    throw new Error(`IG publish failed (${publishResp.status}): ${body}`);
  }
  return (await publishResp.json()) as { id: string };
}

export interface PublishCarouselOptions {
  igUserId: string;
  items: Array<{ imageUrl: string }>;
  caption: string;
  accessToken: string;
}

export async function publishCarousel(
  opts: PublishCarouselOptions
): Promise<{ id: string }> {
  const childIds: string[] = [];
  for (const item of opts.items) {
    const resp = await fetch(
      `${META_GRAPH_BASE}/${opts.igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: item.imageUrl,
          is_carousel_item: true,
          access_token: opts.accessToken,
        }),
      }
    );
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`IG carousel item failed (${resp.status}): ${body}`);
    }
    const child = (await resp.json()) as { id: string };
    childIds.push(child.id);
  }

  const containerResp = await fetch(
    `${META_GRAPH_BASE}/${opts.igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds,
        caption: opts.caption,
        access_token: opts.accessToken,
      }),
    }
  );
  if (!containerResp.ok) {
    const body = await containerResp.text();
    throw new Error(`IG carousel container failed (${containerResp.status}): ${body}`);
  }
  const container = (await containerResp.json()) as { id: string };

  const publishResp = await fetch(
    `${META_GRAPH_BASE}/${opts.igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: opts.accessToken,
      }),
    }
  );
  if (!publishResp.ok) {
    const body = await publishResp.text();
    throw new Error(`IG carousel publish failed (${publishResp.status}): ${body}`);
  }
  return (await publishResp.json()) as { id: string };
}

// ─── Insights ────────────────────────────────────────────────

export interface IGMediaInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saved: number;
  likes: number;
  comments: number;
}

export async function getMediaInsights(
  mediaId: string,
  accessToken: string
): Promise<IGMediaInsights> {
  const metrics = "impressions,reach,engagement,saved,likes,comments";
  const resp = await fetch(
    `${META_GRAPH_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
  );
  if (!resp.ok) {
    return { impressions: 0, reach: 0, engagement: 0, saved: 0, likes: 0, comments: 0 };
  }
  const data = (await resp.json()) as {
    data: Array<{ name: string; values: Array<{ value: number }> }>;
  };

  const out: Record<string, number> = {};
  for (const metric of data.data) {
    out[metric.name] = metric.values?.[0]?.value || 0;
  }

  return {
    impressions: out.impressions || 0,
    reach: out.reach || 0,
    engagement: out.engagement || 0,
    saved: out.saved || 0,
    likes: out.likes || 0,
    comments: out.comments || 0,
  };
}

// ─── Token Management ────────────────────────────────────────

export async function ensureFreshInstagramToken(
  accountId: string
): Promise<string> {
  const account = await prisma.socialAccount.findUniqueOrThrow({
    where: { id: accountId },
    select: {
      accessToken: true,
      tokenExpiresAt: true,
    },
  });

  if (!account.accessToken) {
    throw new Error("No access token for this Instagram account");
  }

  const bufferMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const needsRefresh =
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() - Date.now() < bufferMs;

  if (!needsRefresh) return account.accessToken;

  // Long-lived tokens are refreshed by exchanging the current one
  const refreshed = await exchangeForLongLivedToken(account.accessToken);

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: refreshed.access_token,
      tokenExpiresAt: refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000)
        : undefined,
    },
  });

  return refreshed.access_token;
}
