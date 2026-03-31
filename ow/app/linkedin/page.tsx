'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Linkedin, Plus, Calendar, BarChart3, MessageSquare, Clock,
  CheckCircle2, AlertCircle, FileText, Sparkles, RefreshCw,
  ArrowRight, TrendingUp, Eye, Heart, Share2,
} from 'lucide-react';

interface Account {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  profileUrl: string | null;
  isConnected: boolean;
  accountType: string;
}

interface Post {
  id: string;
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
  _count?: { comments: number };
}

interface Analytics {
  summary: {
    totalPosts: number;
    scheduledCount: number;
    draftCount: number;
    totalImpressions: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalClicks: number;
    engagementRate: number;
  };
}

export default function LinkedInDashboard() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [justConnected, setJustConnected] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [acctRes, postsRes, analyticsRes] = await Promise.all([
        fetch('/api/linkedin/accounts'),
        fetch('/api/linkedin/posts?limit=5'),
        fetch('/api/linkedin/analytics'),
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
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'true') {
      setJustConnected(true);
    }
    if (error) {
      console.error('LinkedIn connect error:', error);
    }
    fetchData();
  }, [searchParams, fetchData]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/linkedin/connect');
      if (!res.ok) throw new Error('Failed to get connect URL');
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Connect error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/linkedin/connect', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-600',
      failed: 'bg-red-100 text-red-700',
    };
    const icons: Record<string, React.ReactNode> = {
      published: <CheckCircle2 className="w-3 h-3" />,
      scheduled: <Clock className="w-3 h-3" />,
      draft: <FileText className="w-3 h-3" />,
      failed: <AlertCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A66C2]" />
      </div>
    );
  }

  const isConnected = accounts.length > 0;
  const stats = analytics?.summary;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0A66C2] flex items-center justify-center">
            <Linkedin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">LinkedIn Manager</h1>
            <p className="text-sm text-gray-500">Manage your LinkedIn presence with AI-powered content</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
          )}
          <Link
            href="/linkedin/compose"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#0A66C2] hover:bg-[#004182] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      {/* Just Connected Banner */}
      {justConnected && isConnected && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            <strong>LinkedIn connected successfully!</strong> Your account is now linked and ready to use.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {searchParams.get('error') && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">
            <strong>Connection issue:</strong> {decodeURIComponent(searchParams.get('error') || '')}. Please try again.
          </p>
        </div>
      )}

      {/* Connection Widget */}
      {!isConnected && !syncing && (
        <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] rounded-xl p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-2">Connect Your LinkedIn Account</h2>
            <p className="text-blue-100 mb-6">
              Link your LinkedIn profile to start creating AI-powered posts, schedule content,
              manage comments, and track your engagement analytics — all from one place.
              You&apos;ll be redirected to LinkedIn to authorize, then brought right back here.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A66C2] rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <Linkedin className="w-5 h-5" />
              {connecting ? 'Redirecting to LinkedIn...' : 'Connect LinkedIn'}
            </button>
          </div>
        </div>
      )}

      {/* Syncing State */}
      {syncing && !isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A66C2] mx-auto mb-3" />
          <p className="text-sm text-blue-700 font-medium">Syncing your LinkedIn account...</p>
        </div>
      )}

      {/* Connected Account Card */}
      {isConnected && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {accounts[0].avatarUrl ? (
                <img src={accounts[0].avatarUrl} alt="" className="w-12 h-12 rounded-full border-2 border-[#0A66C2]/20" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-semibold text-lg">
                  {(accounts[0].displayName || 'L').charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{accounts[0].displayName || accounts[0].username}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {accounts[0].profileUrl ? (
                    <a href={accounts[0].profileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0A66C2] transition-colors">
                      {accounts[0].profileUrl.replace('https://www.linkedin.com/in/', '').replace('/', '')}
                    </a>
                  ) : (
                    <span>{accounts[0].username}</span>
                  )}
                  <span>·</span>
                  <span className="capitalize">{accounts[0].accountType || 'Personal'} Profile</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard icon={<FileText className="w-5 h-5" />} label="Total Posts" value={stats.totalPosts} color="blue" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Scheduled" value={stats.scheduledCount} color="amber" />
          <StatCard icon={<Eye className="w-5 h-5" />} label="Impressions" value={formatNum(stats.totalImpressions)} color="purple" />
          <StatCard icon={<Heart className="w-5 h-5" />} label="Likes" value={formatNum(stats.totalLikes)} color="red" />
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Comments" value={formatNum(stats.totalComments)} color="green" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Engagement" value={`${stats.engagementRate}%`} color="teal" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          href="/linkedin/compose"
          icon={<Sparkles className="w-6 h-6 text-[#0A66C2]" />}
          title="AI Compose"
          desc="Generate LinkedIn posts with AI"
        />
        <QuickAction
          href="/linkedin/calendar"
          icon={<Calendar className="w-6 h-6 text-[#0A66C2]" />}
          title="Content Calendar"
          desc="Plan and schedule your content"
        />
        <QuickAction
          href="/linkedin/posts"
          icon={<MessageSquare className="w-6 h-6 text-[#0A66C2]" />}
          title="Manage Posts"
          desc="View posts and comments"
        />
        <QuickAction
          href="/linkedin/analytics"
          icon={<BarChart3 className="w-6 h-6 text-[#0A66C2]" />}
          title="Analytics"
          desc="Track your performance"
        />
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Posts</h2>
          <Link href="/linkedin/posts" className="text-sm text-[#0A66C2] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">Create your first LinkedIn post to get started</p>
            <Link
              href="/linkedin/compose"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#0A66C2] hover:bg-[#004182] transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Post
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentPosts.map(post => (
              <Link
                key={post.id}
                href={`/linkedin/posts/${post.id}`}
                className="block p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
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
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.impressions}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes}</span>
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
  };
  const iconColors: Record<string, string> = {
    blue: 'text-blue-600', amber: 'text-amber-600', purple: 'text-purple-600',
    red: 'text-red-600', green: 'text-green-600', teal: 'text-teal-600',
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
    <Link href={href} className="bg-white rounded-xl border p-5 hover:border-[#0A66C2]/30 hover:shadow-sm transition-all group">
      <div className="mb-3">{icon}</div>
      <p className="font-medium text-gray-900 group-hover:text-[#0A66C2] transition-colors">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}
