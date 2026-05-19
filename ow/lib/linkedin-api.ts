/**
 * lib/linkedin-api.ts — Direct LinkedIn API v2 integration.
 *
 * Replaces Zernio for all LinkedIn operations: OAuth, posting, analytics,
 * token refresh. Uses the Community Management Posts API.
 *
 * Required env vars:
 *   LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
 *
 * LinkedIn API version header is required on all /rest/* calls.
 */

import { prisma } from "@/lib/db";

const LI_AUTH_BASE = "https://www.linkedin.com/oauth/v2";
const LI_API_BASE = "https://api.linkedin.com";
const LI_API_VERSION = "202604";

function env(name: string): string {
  // Bracket notation prevents Next.js / webpack from inlining at build time
  const val = process.env[name];
  if (!val)
    throw new Error(
      `${name} is not set — add it in the Render dashboard then redeploy`
    );
  return val;
}

function getClientId(): string {
  return env("LINKEDIN_CLIENT_ID");
}

function getClientSecret(): string {
  return env("LINKEDIN_CLIENT_SECRET");
}

// ─── OAuth ───────────────────────────────────────────────────

const PERSONAL_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social",
].join(" ");

const ORG_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social",
  "r_organization_social",
  "w_organization_social",
  "rw_organization_admin",
].join(" ");

export function buildAuthUrl(opts: {
  redirectUri: string;
  state: string;
  includeOrgScopes?: boolean;
}): string {
  const scopes = opts.includeOrgScopes ? ORG_SCOPES : PERSONAL_SCOPES;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getClientId(),
    redirect_uri: opts.redirectUri,
    state: opts.state,
    scope: scopes,
  });
  return `${LI_AUTH_BASE}/authorization?${params}`;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const resp = await fetch(`${LI_AUTH_BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: getClientId(),
      client_secret: getClientSecret(),
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`LinkedIn token exchange failed (${resp.status}): ${body}`);
  }
  return resp.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const resp = await fetch(`${LI_AUTH_BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`LinkedIn token refresh failed (${resp.status}): ${body}`);
  }
  return resp.json() as Promise<TokenResponse>;
}

// ─── API helpers ─────────────────────────────────────────────

async function liApiFetch<T = unknown>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${LI_API_BASE}${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": LI_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`LinkedIn API ${resp.status}: ${body}`);
  }
  const text = await resp.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ─── Profile ─────────────────────────────────────────────────

export interface LinkedInProfile {
  sub: string; // member URN like "urn:li:person:abc123"
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  picture?: string;
}

export async function getMyProfile(
  accessToken: string
): Promise<LinkedInProfile> {
  return liApiFetch<LinkedInProfile>("/v2/userinfo", accessToken);
}

// ─── Organizations ───────────────────────────────────────────

export interface OrgInfo {
  organizationId: string;
  organizationUrn: string;
  name: string;
  vanityName?: string;
  logoUrl?: string;
}

export async function getAdministeredOrgs(
  accessToken: string
): Promise<OrgInfo[]> {
  const data = await liApiFetch<{
    elements: Array<{
      organization: string;
      role: string;
      state: string;
    }>;
  }>(
    "/rest/organizationAcls?q=roleAssignee&projection=(elements*(organization,role,state))",
    accessToken
  );

  const orgs: OrgInfo[] = [];
  for (const el of data.elements || []) {
    if (el.state !== "APPROVED") continue;
    const orgId = el.organization.replace("urn:li:organization:", "");
    try {
      const orgData = await liApiFetch<{
        vanityName?: string;
        localizedName?: string;
        logoV2?: { original?: string };
      }>(`/rest/organizations/${orgId}`, accessToken);
      orgs.push({
        organizationId: orgId,
        organizationUrn: el.organization,
        name: orgData.localizedName || orgId,
        vanityName: orgData.vanityName,
        logoUrl: orgData.logoV2?.original,
      });
    } catch {
      orgs.push({
        organizationId: orgId,
        organizationUrn: el.organization,
        name: orgId,
      });
    }
  }
  return orgs;
}

// ─── Posting ─────────────────────────────────────────────────

export interface CreatePostOptions {
  authorUrn: string; // "urn:li:person:xxx" or "urn:li:organization:xxx"
  text: string;
  visibility?: "PUBLIC" | "CONNECTIONS" | "LOGGED_IN";
  mediaIds?: string[];
}

export interface CreatePostResult {
  postUrn: string;
}

export async function createPost(
  accessToken: string,
  opts: CreatePostOptions
): Promise<CreatePostResult> {
  const body: Record<string, unknown> = {
    author: opts.authorUrn,
    commentary: opts.text,
    visibility: opts.visibility || "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (opts.mediaIds && opts.mediaIds.length > 0) {
    if (opts.mediaIds.length === 1) {
      body.content = {
        media: { id: opts.mediaIds[0] },
      };
    } else {
      body.content = {
        multiImage: {
          images: opts.mediaIds.map((id) => ({ id })),
        },
      };
    }
  }

  const resp = await fetch(`${LI_API_BASE}/rest/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": LI_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LinkedIn create post failed (${resp.status}): ${text}`);
  }

  const postUrn = resp.headers.get("x-restli-id") || "";
  return { postUrn };
}

// ─── Image Upload ────────────────────────────────────────────

export async function initializeImageUpload(
  accessToken: string,
  ownerUrn: string
): Promise<{ uploadUrl: string; imageUrn: string }> {
  const data = await liApiFetch<{
    value: {
      uploadUrlExpiresAt: number;
      uploadUrl: string;
      image: string;
    };
  }>("/rest/images?action=initializeUpload", accessToken, {
    method: "POST",
    body: JSON.stringify({
      initializeUploadRequest: { owner: ownerUrn },
    }),
  });

  return {
    uploadUrl: data.value.uploadUrl,
    imageUrn: data.value.image,
  };
}

export async function uploadImageBinary(
  uploadUrl: string,
  accessToken: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<void> {
  const resp = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
    },
    body: new Uint8Array(imageBuffer),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LinkedIn image upload failed (${resp.status}): ${text}`);
  }
}

// ─── Analytics ───────────────────────────────────────────────

export interface PostStats {
  impressionCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  clickCount: number;
  uniqueImpressions: number;
}

export async function getPostStats(
  accessToken: string,
  postUrn: string,
  authorUrn: string
): Promise<PostStats> {
  const isOrg = authorUrn.includes("organization");
  const endpoint = isOrg
    ? `/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(authorUrn)}&shares=${encodeURIComponent(postUrn)}`
    : `/rest/socialMetadata/${encodeURIComponent(postUrn)}`;

  try {
    const data = await liApiFetch<Record<string, unknown>>(endpoint, accessToken);
    if (isOrg) {
      const el = (data.elements as Array<Record<string, unknown>>)?.[0] || {};
      const stats = (el.totalShareStatistics || {}) as Record<string, number>;
      return {
        impressionCount: stats.impressionCount || 0,
        likeCount: stats.likeCount || 0,
        commentCount: stats.commentCount || 0,
        shareCount: stats.shareCount || 0,
        clickCount: stats.clickCount || 0,
        uniqueImpressions: stats.uniqueImpressionsCount || 0,
      };
    }
    return {
      impressionCount: (data.impressionCount as number) || 0,
      likeCount: (data.likeCount as number) || 0,
      commentCount: (data.commentCount as number) || 0,
      shareCount: (data.shareCount as number) || 0,
      clickCount: (data.clickCount as number) || 0,
      uniqueImpressions: (data.uniqueImpressionsCount as number) || 0,
    };
  } catch {
    return { impressionCount: 0, likeCount: 0, commentCount: 0, shareCount: 0, clickCount: 0, uniqueImpressions: 0 };
  }
}

// ─── Token Management ────────────────────────────────────────

/**
 * Ensures the SocialAccount's access token is fresh. If it's within 24h
 * of expiry and a refresh token exists, refreshes it and persists.
 */
export async function ensureFreshToken(
  accountId: string
): Promise<string> {
  const account = await prisma.socialAccount.findUniqueOrThrow({
    where: { id: accountId },
    select: {
      accessToken: true,
      refreshToken: true,
      tokenExpiresAt: true,
    },
  });

  if (!account.accessToken) {
    throw new Error("No access token stored for this account");
  }

  const bufferMs = 24 * 60 * 60 * 1000;
  const needsRefresh =
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() - Date.now() < bufferMs;

  if (!needsRefresh) return account.accessToken;

  if (!account.refreshToken) {
    throw new Error("Token expired and no refresh token available — reconnect required");
  }

  const tokens = await refreshAccessToken(account.refreshToken);

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || account.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      tokenScope: tokens.scope,
    },
  });

  return tokens.access_token;
}
