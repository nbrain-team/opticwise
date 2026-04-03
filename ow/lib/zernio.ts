const ZERNIO_BASE_URL = 'https://zernio.com/api/v1';

function getApiKey(): string {
  const key = process.env.ZERNIO_API_KEY;
  if (!key) throw new Error('ZERNIO_API_KEY environment variable is not set');
  return key;
}

async function zernioFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ZERNIO_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zernio API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Profiles ────────────────────────────────────────

export interface ZernioProfileData {
  _id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  color?: string;
  accountUsernames?: string[];
  createdAt: string;
  updatedAt: string;
}

export async function listProfiles(): Promise<{ profiles: ZernioProfileData[] }> {
  return zernioFetch('/profiles');
}

export async function createProfile(name: string, description?: string) {
  return zernioFetch<{ profile: ZernioProfileData }>('/profiles', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

// ─── Connect ─────────────────────────────────────────

export async function getConnectUrl(
  platform: string,
  profileId: string,
  opts?: { redirectUrl?: string; headless?: boolean }
): Promise<{ authUrl: string; state: string }> {
  const params = new URLSearchParams({ profileId });
  if (opts?.redirectUrl) params.set('redirect_url', opts.redirectUrl);
  if (opts?.headless) params.set('headless', 'true');
  return zernioFetch(`/connect/${platform}?${params.toString()}`);
}

export async function selectLinkedInOrg(body: {
  profileId: string;
  tempToken: string;
  userProfile: Record<string, unknown>;
  accountType: 'personal' | 'organization';
  selectedOrganization?: Record<string, unknown>;
}): Promise<{ message: string; account: ZernioAccountData }> {
  return zernioFetch('/connect/linkedin/select-organization', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Accounts ────────────────────────────────────────

export interface ZernioAccountData {
  _id?: string;
  accountId?: string;
  platform: string;
  username?: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  profilePicture?: string;
  profileUrl?: string;
  profileId?: string;
  status?: string;
  type?: string;
  accountType?: string;
  isActive?: boolean;
  metadata?: {
    accountType?: string;
    userProfile?: {
      displayName?: string;
      profilePicture?: string;
      profileUrl?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export function getAccountId(acct: ZernioAccountData): string {
  const id = acct._id || acct.accountId;
  if (!id) throw new Error('Zernio account has no _id or accountId');
  return id;
}

export async function listAccounts(): Promise<{
  accounts: ZernioAccountData[];
  hasAnalyticsAccess: boolean;
}> {
  return zernioFetch('/accounts');
}

export async function getLinkedInOrganizations(accountId: string) {
  return zernioFetch(`/accounts/${accountId}/linkedin-organizations`);
}

// ─── Posts ────────────────────────────────────────────

export interface ZernioMediaItem {
  type: 'image' | 'video' | 'document';
  url: string;
  title?: string;
}

export interface ZernioPlatformEntry {
  platform: string;
  accountId: string;
  platformSpecificData?: {
    firstComment?: string;
    organizationUrn?: string;
    documentTitle?: string;
    disableLinkPreview?: boolean;
  };
}

export interface CreatePostParams {
  content: string;
  platforms: ZernioPlatformEntry[];
  mediaItems?: ZernioMediaItem[];
  publishNow?: boolean;
  scheduledFor?: string;
  timezone?: string;
}

export interface ZernioPostData {
  _id: string;
  content: string;
  platforms: ZernioPlatformEntry[];
  mediaItems?: ZernioMediaItem[];
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
  timezone?: string;
  analytics?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function createPost(params: CreatePostParams): Promise<{ post: ZernioPostData }> {
  return zernioFetch('/posts', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function listPosts(query?: {
  status?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}): Promise<{ posts: ZernioPostData[]; total?: number }> {
  const searchParams = new URLSearchParams();
  if (query?.status) searchParams.set('status', query.status);
  if (query?.platform) searchParams.set('platform', query.platform);
  if (query?.limit) searchParams.set('limit', String(query.limit));
  if (query?.offset) searchParams.set('offset', String(query.offset));
  const qs = searchParams.toString();
  return zernioFetch(`/posts${qs ? `?${qs}` : ''}`);
}

export async function getPost(postId: string): Promise<{ post: ZernioPostData }> {
  return zernioFetch(`/posts/${postId}`);
}

export async function updatePost(
  postId: string,
  params: Partial<CreatePostParams>
): Promise<{ post: ZernioPostData }> {
  return zernioFetch(`/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deletePost(postId: string): Promise<void> {
  await zernioFetch(`/posts/${postId}`, { method: 'DELETE' });
}

// ─── Media ───────────────────────────────────────────

export async function uploadMedia(
  file: Blob,
  filename: string
): Promise<{ url: string; type: string }> {
  const formData = new FormData();
  formData.append('file', file, filename);

  const url = `${ZERNIO_BASE_URL}/media/upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getApiKey()}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zernio media upload error ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── Comments ────────────────────────────────────────

export interface ZernioComment {
  _id: string;
  postId: string;
  platformPostId?: string;
  platform: string;
  author: {
    name: string;
    username?: string;
    avatar?: string;
    profileUrl?: string;
  };
  content: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
}

export async function listComments(query?: {
  postId?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}): Promise<{ comments: ZernioComment[]; total?: number }> {
  const searchParams = new URLSearchParams();
  if (query?.postId) searchParams.set('postId', query.postId);
  if (query?.platform) searchParams.set('platform', query.platform);
  if (query?.limit) searchParams.set('limit', String(query.limit));
  if (query?.offset) searchParams.set('offset', String(query.offset));
  const qs = searchParams.toString();
  return zernioFetch(`/comments${qs ? `?${qs}` : ''}`);
}

export async function replyToComment(
  commentId: string,
  content: string
): Promise<{ comment: ZernioComment }> {
  return zernioFetch(`/comments/${commentId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ─── Analytics ───────────────────────────────────────

export interface ZernioAnalytics {
  posts: Array<{
    postId: string;
    metrics: {
      impressions?: number;
      reach?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      clicks?: number;
      views?: number;
    };
  }>;
  aggregate?: {
    totalImpressions?: number;
    totalReach?: number;
    totalLikes?: number;
    totalComments?: number;
    totalShares?: number;
    totalClicks?: number;
  };
}

export async function getAnalytics(query: {
  platform: string;
  fromDate: string;
  toDate: string;
  accountId?: string;
}): Promise<ZernioAnalytics> {
  const searchParams = new URLSearchParams({
    platform: query.platform,
    fromDate: query.fromDate,
    toDate: query.toDate,
  });
  if (query.accountId) searchParams.set('accountId', query.accountId);
  return zernioFetch(`/analytics?${searchParams.toString()}`);
}

// ─── Queue ───────────────────────────────────────────

export interface ZernioQueueSlot {
  _id: string;
  day: string;
  time: string;
  timezone: string;
  profileId: string;
}

export async function listQueueSlots(profileId: string): Promise<{ slots: ZernioQueueSlot[] }> {
  return zernioFetch(`/queue?profileId=${profileId}`);
}

export async function createQueueSlot(params: {
  profileId: string;
  day: string;
  time: string;
  timezone: string;
}): Promise<{ slot: ZernioQueueSlot }> {
  return zernioFetch('/queue', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
