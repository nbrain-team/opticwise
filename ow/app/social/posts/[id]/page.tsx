'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Linkedin, Instagram, Search, CheckCircle2,
  Clock, FileText, AlertCircle, Eye, Heart, MessageSquare,
  Share2, Sparkles, MoreHorizontal, Trash2, Send, Shield,
  MousePointerClick, XCircle, MonitorSmartphone,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import SocialPostPreview from '../../components/SocialPostPreview';

interface Comment {
  id: string;
  authorName: string;
  authorProfileUrl: string | null;
  content: string;
  createdAt: string;
  likes: number;
}

interface MediaItem {
  type: string;
  url: string;
  filename: string;
  mediaId?: string;
  preview?: string;
}

interface PostDetail {
  id: string;
  content: string;
  firstComment: string | null;
  platform: string;
  socialAccountId: string | null;
  status: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  impressions: number;
  likes: number;
  commentCount: number;
  shares: number;
  clicks: number;
  aiGenerated: boolean;
  riskTier: string | null;
  riskReason: string | null;
  mediaItems: MediaItem[] | null;
  mediaType: string | null;
  socialAccount: {
    id: string;
    displayName: string | null;
    username: string | null;
    platform: string;
    accountType: string;
    avatarUrl: string | null;
  } | null;
  comments: Comment[];
}

const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  if (platform === 'instagram') return <Instagram className={className || 'w-4 h-4 text-pink-500'} />;
  return <Linkedin className={className || 'w-4 h-4 text-[#0A66C2]'} />;
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/social/posts/${postId}?includeComments=true`);
      if (!res.ok) {
        setError(res.status === 404 ? 'Post not found' : 'Failed to load post');
        return;
      }
      const data = await res.json();
      const loaded = data.post || data;
      setPost(loaded);
      // Resolve media preview URLs for items with mediaId
      if (loaded.mediaItems?.length && loaded.socialAccountId) {
        for (let i = 0; i < loaded.mediaItems.length; i++) {
          const item = loaded.mediaItems[i];
          if (item.mediaId && !item.preview && !item.url) {
            fetch(`/api/social/media/preview?mediaId=${encodeURIComponent(item.mediaId)}&accountId=${encodeURIComponent(loaded.socialAccountId)}`)
              .then(r => r.ok ? r.json() : null)
              .then(result => {
                if (result?.url) {
                  setPost(prev => {
                    if (!prev) return prev;
                    const updated = [...(prev.mediaItems || [])];
                    updated[i] = { ...updated[i], preview: result.url };
                    return { ...prev, mediaItems: updated };
                  });
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Fetch post error:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/social/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) router.push('/social/posts');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish this post now?')) return;
    try {
      const res = await fetch(`/api/social/posts/${postId}/publish`, { method: 'POST' });
      if (res.ok) fetchPost();
    } catch (err) {
      console.error('Publish error:', err);
    }
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
      published: <CheckCircle2 className="w-3.5 h-3.5" />,
      scheduled: <Clock className="w-3.5 h-3.5" />,
      pending_approval: <Shield className="w-3.5 h-3.5" />,
      publishing: <Send className="w-3.5 h-3.5" />,
      draft: <FileText className="w-3.5 h-3.5" />,
      failed: <AlertCircle className="w-3.5 h-3.5" />,
      rejected: <XCircle className="w-3.5 h-3.5" />,
    };
    const label = status
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {icons[status]} {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-6">
        <Link href="/social/posts" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Posts
        </Link>
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700">{error || 'Post not found'}</p>
          <Link
            href="/social/posts"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  const canPublish = post.status === 'draft' || post.status === 'failed' || post.status === 'rejected';
  const canDelete = post.status !== 'published' && post.status !== 'publishing';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back nav */}
      <Link
        href="/social/posts"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Posts
      </Link>

      {/* Post header card */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="p-6">
          {/* Top row: account + actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {post.socialAccount?.avatarUrl ? (
                <img src={post.socialAccount.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <PlatformIcon platform={post.platform} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {post.socialAccount?.displayName || 'Unknown Account'}
                  </span>
                  <PlatformIcon platform={post.platform} />
                  {post.socialAccount?.accountType && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {post.socialAccount.accountType === 'company_page' ? 'Company' : 'Personal'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {post.publishedAt
                    ? `Published ${new Date(post.publishedAt).toLocaleString()}`
                    : post.scheduledFor
                    ? `Scheduled for ${new Date(post.scheduledFor).toLocaleString()}`
                    : `Created ${new Date(post.createdAt).toLocaleString()}`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canPublish && (
                <button
                  onClick={handlePublish}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Send className="w-4 h-4" /> Publish Now
                </button>
              )}
              <Link
                href={`/social/compose?edit=${post.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FileText className="w-4 h-4" /> Edit
              </Link>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Status + risk badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {statusBadge(post.status)}
            {post.riskTier && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                post.riskTier === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              }`}>
                <Shield className="w-3.5 h-3.5" />
                {post.riskTier.charAt(0).toUpperCase() + post.riskTier.slice(1)} Risk
              </span>
            )}
            {post.aiGenerated && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <Sparkles className="w-3.5 h-3.5" /> AI Generated
              </span>
            )}
            {post.mediaType && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                📎 {post.mediaType}
              </span>
            )}
          </div>

          {/* Risk reason callout */}
          {post.riskReason && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 rounded-lg border border-amber-100">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">Risk flags: </span>
                {post.riskReason}
              </div>
            </div>
          )}

          {/* Content / Preview toggle */}
          <div className="flex items-center gap-1 mb-3 border-b">
            <button
              onClick={() => setShowPreview(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                showPreview
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MonitorSmartphone className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                !showPreview
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" /> Raw Content
            </button>
          </div>

          {showPreview ? (
            <SocialPostPreview
              content={post.content}
              platform={post.platform}
              firstComment={post.firstComment}
              mediaItems={post.mediaItems}
              accountName={post.socialAccount?.displayName}
              accountUsername={post.socialAccount?.username}
              accountAvatarUrl={post.socialAccount?.avatarUrl}
              accountType={post.socialAccount?.accountType}
              defaultExpanded
            />
          ) : (
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      {post.status === 'published' && (
        <div className="bg-white rounded-xl border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-900">Engagement</h2>
          </div>
          <div className="grid grid-cols-5 divide-x">
            {[
              { icon: Eye, label: 'Impressions', value: post.impressions },
              { icon: Heart, label: 'Likes', value: post.likes },
              { icon: MessageSquare, label: 'Comments', value: post.commentCount },
              { icon: Share2, label: 'Shares', value: post.shares },
              { icon: MousePointerClick, label: 'Clicks', value: post.clicks },
            ].map(metric => (
              <div key={metric.label} className="px-4 py-5 text-center">
                <metric.icon className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                <p className="text-2xl font-semibold text-gray-900">{metric.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {post.comments && post.comments.length > 0 && (
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-900">
              Comments ({post.comments.length})
            </h2>
          </div>
          <div className="divide-y">
            {post.comments.map(comment => (
              <div key={comment.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    {comment.likes > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                        <Heart className="w-3 h-3" /> {comment.likes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
