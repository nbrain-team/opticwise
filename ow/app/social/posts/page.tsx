'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Linkedin, Instagram, Search, CheckCircle2,
  Clock, FileText, AlertCircle, Eye, Heart, MessageSquare,
  Share2, Sparkles, MoreHorizontal, Trash2, Send, Shield,
  MousePointerClick, XCircle,
} from 'lucide-react';

interface Post {
  id: string;
  content: string;
  platform: string;
  status: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  impressions: number;
  likes: number;
  commentCount: number;
  shares: number;
  clicks: number;
  aiGenerated: boolean;
  riskTier: string | null;
  mediaItems: unknown[] | null;
  mediaType: string | null;
  socialAccount: {
    id: string;
    displayName: string | null;
    platform: string;
    accountType: string;
    avatarUrl: string | null;
  } | null;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All Posts' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'draft', label: 'Drafts' },
  { value: 'failed', label: 'Failed' },
  { value: 'rejected', label: 'Rejected' },
];

const PLATFORM_FILTERS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
];

const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  if (platform === 'instagram') return <Instagram className={className || 'w-4 h-4 text-pink-500'} />;
  return <Linkedin className={className || 'w-4 h-4 text-[#0A66C2]'} />;
};

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (platformFilter !== 'all') params.set('platform', platformFilter);
      params.set('limit', '50');
      const res = await fetch(`/api/social/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, platformFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/social/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setTotal(prev => prev - 1);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
    setMenuOpen(null);
  };

  const handlePublish = async (postId: string) => {
    if (!confirm('Publish this post now?')) return;
    try {
      const res = await fetch(`/api/social/posts/${postId}/publish`, { method: 'POST' });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error('Publish error:', err);
    }
    setMenuOpen(null);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700',
      pending_approval: 'bg-amber-100 text-amber-700',
      publishing: 'bg-cyan-100 text-cyan-700',
      draft: 'bg-gray-100 text-gray-600',
      failed: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-600',
    };
    const icons: Record<string, React.ReactNode> = {
      published: <CheckCircle2 className="w-3 h-3" />,
      scheduled: <Clock className="w-3 h-3" />,
      pending_approval: <Shield className="w-3 h-3" />,
      publishing: <Send className="w-3 h-3" />,
      draft: <FileText className="w-3 h-3" />,
      failed: <AlertCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
    };
    const label = status
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {icons[status]} {label}
      </span>
    );
  };

  const riskBadge = (tier: string | null) => {
    if (!tier) return null;
    const color = tier === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Shield className="w-3 h-3" /> {tier.charAt(0).toUpperCase() + tier.slice(1)} Risk
      </span>
    );
  };

  const filteredPosts = searchQuery
    ? posts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : posts;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/social" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Social Posts</h1>
            <p className="text-sm text-gray-500">{total} total posts</p>
          </div>
        </div>
        <Link
          href="/social/compose"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
        >
          {PLATFORM_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700">No posts found</p>
          <p className="text-sm text-gray-500 mt-1">
            {statusFilter !== 'all' || platformFilter !== 'all'
              ? 'Try adjusting your filters or '
              : ''}
            Create your first post to get started
          </p>
          <Link
            href="/social/compose"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Post
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {filteredPosts.map(post => (
            <div key={post.id} className="p-5 hover:bg-gray-50/50 transition-colors relative">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Status + badges row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <PlatformIcon platform={post.platform} />
                    {statusBadge(post.status)}
                    {riskBadge(post.riskTier)}
                    {post.aiGenerated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Sparkles className="w-3 h-3" /> AI Generated
                      </span>
                    )}
                    {post.mediaType && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        📎 {post.mediaType}
                      </span>
                    )}
                  </div>

                  {/* Content preview */}
                  <Link href={`/social/posts/${post.id}`} className="block">
                    <p className="text-sm text-gray-800 line-clamp-2 mb-2 hover:text-indigo-600 transition-colors">
                      {post.content}
                    </p>
                  </Link>

                  {/* Account + date info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {post.socialAccount && (
                      <span className="inline-flex items-center gap-1">
                        <PlatformIcon platform={post.socialAccount.platform} className="w-3 h-3 text-gray-400" />
                        {post.socialAccount.displayName || 'Unknown Account'}
                      </span>
                    )}
                    <span>
                      {post.publishedAt
                        ? `Published ${new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                        : post.scheduledFor
                        ? `Scheduled for ${new Date(post.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                        : `Created ${new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      }
                    </span>
                  </div>
                </div>

                {/* Engagement Stats */}
                {post.status === 'published' && (
                  <div className="flex items-center gap-5 text-xs text-gray-500 flex-shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-gray-400"><Eye className="w-3.5 h-3.5" /></div>
                      <span className="font-medium text-gray-700">{post.impressions}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-gray-400"><Heart className="w-3.5 h-3.5" /></div>
                      <span className="font-medium text-gray-700">{post.likes}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-gray-400"><MessageSquare className="w-3.5 h-3.5" /></div>
                      <span className="font-medium text-gray-700">{post.commentCount}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-gray-400"><Share2 className="w-3.5 h-3.5" /></div>
                      <span className="font-medium text-gray-700">{post.shares}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-gray-400"><MousePointerClick className="w-3.5 h-3.5" /></div>
                      <span className="font-medium text-gray-700">{post.clicks}</span>
                    </div>
                  </div>
                )}

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOpen === post.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg border shadow-lg py-1 z-10 min-w-[160px]">
                      <Link
                        href={`/social/posts/${post.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </Link>
                      <Link
                        href={`/social/compose?edit=${post.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileText className="w-4 h-4" /> Edit
                      </Link>
                      {(post.status === 'draft' || post.status === 'failed' || post.status === 'rejected') && (
                        <button
                          onClick={() => handlePublish(post.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                        >
                          <Send className="w-4 h-4" /> Publish Now
                        </button>
                      )}
                      {post.status !== 'published' && post.status !== 'publishing' && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
