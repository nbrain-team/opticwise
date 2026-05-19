'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Linkedin, Instagram, Plus, Calendar, BarChart3, MessageSquare, Clock,
  CheckCircle2, AlertCircle, FileText, Sparkles, RefreshCw,
  ArrowRight, TrendingUp, Eye, Heart, Share2, Shield, Settings,
  Send, Inbox,
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'linkedin' | 'instagram';
  displayName: string;
  username: string;
  avatarUrl: string;
  accountType: string;
  isConnected: boolean;
  autoPublish: boolean;
}

interface Post {
  id: string;
  platform: 'linkedin' | 'instagram';
  content: string;
  status: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  impressions: number;
  likes: number;
  commentCount: number;
  shares: number;
  clicks: number;
  aiGenerated: boolean;
}

interface Analytics {
  summary: {
    totalPosts: number;
    scheduledCount: number;
    pendingApprovalCount: number;
    draftCount: number;
    totalImpressions: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalClicks: number;
    engagementRate: number;
  };
}

const PLATFORM_META = {
  linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LinkedIn', bg: 'bg-[#0A66C2]' },
  instagram: { icon: Instagram, color: '#E1306C', label: 'Instagram', bg: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]' },
} as const;

export default function SocialPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <SocialDashboard />
    </Suspense>
  );
}

function SocialDashboard() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [acctRes, postsRes, analyticsRes] = await Promise.all([
        fetch('/api/social/accounts'),
        fetch('/api/social/posts?perPage=5'),
        fetch('/api/social/analytics'),
      ]);

      if (acctRes.ok) {
        const data = await acctRes.json();
        setAccounts(data.accounts || []);
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        setRecentPosts(data.posts || []);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Social dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      const label = PLATFORM_META[connected as keyof typeof PLATFORM_META]?.label || connected;
      setToast({ type: 'success', message: `${label} connected successfully! Your account is now linked and ready to use.` });
    }
    if (error) {
      setToast({ type: 'error', message: decodeURIComponent(error) });
    }

    fetchData();
  }, [searchParams, fetchData]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleConnect = async (platform: 'linkedin' | 'instagram') => {
    setConnectingPlatform(platform);
    try {
      const connectResponse = await fetch(
        `/api/social/connect/${platform}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      if (!connectResponse.ok) {
        const errBody = await connectResponse.json().catch(() => ({}));
        throw new Error(errBody.error || `Failed to start ${platform} OAuth`);
      }
      const data = await connectResponse.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (connectErr) {
      console.error('Connect error:', connectErr);
      const msg = connectErr instanceof Error ? connectErr.message : 'Connection failed';
      setToast({ type: 'error', message: `Could not connect to ${PLATFORM_META[platform].label}: ${msg}` });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleToggleAutoPublish = async (accountId: string, current: boolean) => {
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, autoPublish: !current } : a));
    try {
      await fetch(`/api/social/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPublish: !current }),
      });
    } catch {
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, autoPublish: current } : a));
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-600',
      pending_approval: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-700',
    };
    const icons: Record<string, React.ReactNode> = {
      published: <CheckCircle2 className="w-3 h-3" />,
      scheduled: <Clock className="w-3 h-3" />,
      draft: <FileText className="w-3 h-3" />,
      pending_approval: <Shield className="w-3 h-3" />,
      failed: <AlertCircle className="w-3 h-3" />,
    };
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {icons[status] || icons.draft} {label}
      </span>
    );
  };

  const PlatformIcon = ({ platform, size = 16 }: { platform: string; size?: number }) => {
    const meta = PLATFORM_META[platform as keyof typeof PLATFORM_META];
    if (!meta) return null;
    const Icon = meta.icon;
    return <Icon style={{ width: size, height: size, color: meta.color }} />;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const stats = analytics?.summary;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Social Posting Manager</h1>
            <p className="text-sm text-gray-500">Manage your LinkedIn and Instagram presence with AI-powered content</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/social/compose"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      {/* Toast Banner */}
      {toast && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          toast.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <p className={`text-sm flex-1 ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {toast.message}
          </p>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Connected Accounts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Connected Accounts</h2>
          <Link href="/social/schedules" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <Settings className="w-4 h-4" /> Schedules
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(account => {
            const meta = PLATFORM_META[account.platform];
            const Icon = meta.icon;
            return (
              <div key={account.id} className="bg-white rounded-xl border p-5 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {account.avatarUrl ? (
                    <Image src={account.avatarUrl} alt="" width={48} height={48} className="w-12 h-12 rounded-full border" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${meta.bg} flex items-center justify-center text-white font-semibold text-lg`}>
                      {account.displayName.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm border">
                    <Icon style={{ width: 12, height: 12, color: meta.color }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{account.displayName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{meta.label}</span>
                    <span>·</span>
                    <span className="capitalize">{account.accountType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => handleToggleAutoPublish(account.id, account.autoPublish)}
                    title={account.autoPublish ? 'Auto-publish on' : 'Auto-publish off'}
                    className={`relative w-9 h-5 rounded-full transition-colors ${account.autoPublish ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${account.autoPublish ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    account.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {account.isConnected ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {account.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Connect Buttons */}
          <button
            onClick={() => handleConnect('linkedin')}
            disabled={connectingPlatform === 'linkedin'}
            className="bg-white rounded-xl border border-dashed border-gray-300 p-5 flex items-center gap-4 hover:border-[#0A66C2]/40 hover:bg-blue-50/30 transition-all group disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-[#0A66C2]/10 flex items-center justify-center group-hover:bg-[#0A66C2]/20 transition-colors">
              <Linkedin className="w-6 h-6 text-[#0A66C2]" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 group-hover:text-[#0A66C2] transition-colors">
                {connectingPlatform === 'linkedin' ? 'Redirecting...' : 'Connect LinkedIn'}
              </p>
              <p className="text-xs text-gray-500">Link a LinkedIn profile or page</p>
            </div>
            <Plus className="w-5 h-5 text-gray-400 ml-auto" />
          </button>

          <button
            onClick={() => handleConnect('instagram')}
            disabled={connectingPlatform === 'instagram'}
            className="bg-white rounded-xl border border-dashed border-gray-300 p-5 flex items-center gap-4 hover:border-pink-300 hover:bg-pink-50/30 transition-all group disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-pink-100/60 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
              <Instagram className="w-6 h-6 text-[#E1306C]" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 group-hover:text-[#E1306C] transition-colors">
                {connectingPlatform === 'instagram' ? 'Redirecting...' : 'Connect Instagram'}
              </p>
              <p className="text-xs text-gray-500">Link an Instagram business account</p>
            </div>
            <Plus className="w-5 h-5 text-gray-400 ml-auto" />
          </button>
        </div>
      </section>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={<FileText className="w-5 h-5" />} label="Total Posts" value={stats.totalPosts} color="blue" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Scheduled" value={stats.scheduledCount} color="amber" />
          <StatCard icon={<Shield className="w-5 h-5" />} label="Pending Approval" value={stats.pendingApprovalCount} color="orange" />
          <StatCard icon={<FileText className="w-5 h-5" />} label="Drafts" value={stats.draftCount} color="gray" />
          <StatCard icon={<Eye className="w-5 h-5" />} label="Impressions" value={formatNum(stats.totalImpressions)} color="purple" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Engagement" value={`${stats.engagementRate}%`} color="teal" />
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction href="/social/compose" icon={<Sparkles className="w-6 h-6 text-indigo-600" />} title="Compose" desc="Create a new post with AI assistance" />
        <QuickAction href="/social/posts" icon={<MessageSquare className="w-6 h-6 text-indigo-600" />} title="All Posts" desc="View and manage all your content" />
        <QuickAction href="/social/calendar" icon={<Calendar className="w-6 h-6 text-indigo-600" />} title="Content Calendar" desc="Plan and schedule across platforms" />
        <QuickAction href="/social/analytics" icon={<BarChart3 className="w-6 h-6 text-indigo-600" />} title="Analytics" desc="Track performance and engagement" />
        <QuickAction href="/social/pending-approval" icon={<Inbox className="w-6 h-6 text-amber-600" />} title="Pending Approval" desc="Review posts awaiting approval" />
        <QuickAction href="/social/schedules" icon={<RefreshCw className="w-6 h-6 text-indigo-600" />} title="Schedules" desc="Manage recurring posting schedules" />
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Posts</h2>
          <Link href="/social/posts" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">Create your first post to get started</p>
            <Link
              href="/social/compose"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Post
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentPosts.map(post => (
              <Link
                key={post.id}
                href={`/social/posts/${post.id}`}
                className="block p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon platform={post.platform} size={14} />
                      {statusBadge(post.status)}
                      {post.aiGenerated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : post.scheduledFor
                          ? `Scheduled: ${new Date(post.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                          : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                  </div>
                  {post.status === 'published' && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatNum(post.impressions)}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {formatNum(post.likes)}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.commentCount}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> {post.shares}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50', amber: 'bg-amber-50', purple: 'bg-purple-50',
    red: 'bg-red-50', green: 'bg-green-50', teal: 'bg-teal-50',
    orange: 'bg-orange-50', gray: 'bg-gray-100',
  };
  const iconColors: Record<string, string> = {
    blue: 'text-blue-600', amber: 'text-amber-600', purple: 'text-purple-600',
    red: 'text-red-600', green: 'text-green-600', teal: 'text-teal-600',
    orange: 'text-orange-600', gray: 'text-gray-600',
  };
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bgColors[color]} ${iconColors[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border p-5 hover:border-indigo-200 hover:shadow-sm transition-all group">
      <div className="mb-3">{icon}</div>
      <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

