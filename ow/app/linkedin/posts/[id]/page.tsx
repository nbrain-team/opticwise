'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Linkedin, CheckCircle2, Clock, FileText, AlertCircle,
  Eye, Heart, MessageSquare, Share2, MousePointerClick, Sparkles,
  Send, Loader2, Trash2, Wand2, RefreshCw,
} from 'lucide-react';

interface Comment {
  id: string;
  authorName: string;
  authorUsername: string | null;
  authorAvatar: string | null;
  authorProfileUrl: string | null;
  content: string;
  commentedAt: string;
  aiSuggestedReply: string | null;
  repliedWith: string | null;
  repliedAt: string | null;
  replies: Comment[];
}

interface Post {
  id: string;
  content: string;
  firstComment: string | null;
  status: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  impressions: number;
  likes: number;
  commentCount: number;
  shares: number;
  clicks: number;
  reach: number;
  aiGenerated: boolean;
  aiPrompt: string | null;
  aiTopicCategory: string | null;
  errorMessage: string | null;
  mediaItems: unknown[] | null;
  account: { displayName: string; username: string; avatarUrl: string | null };
  comments: Comment[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [generatingReply, setGeneratingReply] = useState<string | null>(null);
  const [refreshingComments, setRefreshingComments] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/linkedin/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const refreshComments = async () => {
    setRefreshingComments(true);
    try {
      const res = await fetch(`/api/linkedin/posts/${postId}/comments`);
      if (res.ok) {
        await fetchPost();
      }
    } catch (err) {
      console.error('Refresh comments error:', err);
    } finally {
      setRefreshingComments(false);
    }
  };

  const generateAiReply = async (comment: Comment) => {
    if (!post) return;
    setGeneratingReply(comment.id);
    try {
      const res = await fetch('/api/linkedin/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentContent: comment.content,
          postContent: post.content,
          authorName: comment.authorName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplyTexts(prev => ({ ...prev, [comment.id]: data.reply }));
      }
    } catch (err) {
      console.error('AI reply error:', err);
    } finally {
      setGeneratingReply(null);
    }
  };

  const sendReply = async (commentId: string) => {
    const content = replyTexts[commentId];
    if (!content?.trim()) return;
    setReplyingTo(commentId);
    try {
      const res = await fetch(`/api/linkedin/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content }),
      });
      if (res.ok) {
        setReplyTexts(prev => {
          const copy = { ...prev };
          delete copy[commentId];
          return copy;
        });
        await fetchPost();
      }
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      setReplyingTo(null);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish this post to LinkedIn now?')) return;
    try {
      const res = await fetch(`/api/linkedin/posts/${postId}/publish`, { method: 'POST' });
      if (res.ok) fetchPost();
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/linkedin/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) router.push('/linkedin/posts');
    } catch (err) {
      console.error('Delete error:', err);
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
      published: <CheckCircle2 className="w-3.5 h-3.5" />,
      scheduled: <Clock className="w-3.5 h-3.5" />,
      draft: <FileText className="w-3.5 h-3.5" />,
      failed: <AlertCircle className="w-3.5 h-3.5" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.draft}`}>
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

  if (!post) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Post not found</p>
        <Link href="/linkedin/posts" className="text-[#0A66C2] hover:underline mt-2 inline-block">Back to Posts</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/linkedin/posts" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            <h1 className="text-xl font-semibold text-gray-900">Post Detail</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(post.status === 'draft' || post.status === 'failed') && (
            <button
              onClick={handlePublish}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Send className="w-4 h-4" /> Publish Now
            </button>
          )}
          {post.status !== 'published' && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border">
            <div className="p-6">
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                {post.account.avatarUrl ? (
                  <Image src={post.account.avatarUrl} alt="" width={48} height={48} className="w-12 h-12 rounded-full" unoptimized />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-semibold text-lg">
                    {(post.account.displayName || 'L').charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{post.account.displayName}</p>
                  <p className="text-xs text-gray-500">@{post.account.username}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {statusBadge(post.status)}
                  {post.aiGenerated && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Sparkles className="w-3 h-3" /> AI Generated
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed mb-4"
                   style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                {post.content}
              </div>

              {post.firstComment && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-1">First Comment:</p>
                  <p className="text-sm text-blue-900">{post.firstComment}</p>
                </div>
              )}

              {post.errorMessage && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs font-medium text-red-700 mb-1">Error:</p>
                  <p className="text-sm text-red-600">{post.errorMessage}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-4 pt-4 border-t text-xs text-gray-500 space-y-1">
                <p>Created: {new Date(post.createdAt).toLocaleString()}</p>
                {post.publishedAt && <p>Published: {new Date(post.publishedAt).toLocaleString()}</p>}
                {post.scheduledFor && <p>Scheduled for: {new Date(post.scheduledFor).toLocaleString()}</p>}
                {post.aiTopicCategory && <p>Category: {post.aiTopicCategory}</p>}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl border">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0A66C2]" />
                Comments ({post.comments?.length || 0})
              </h2>
              <button
                onClick={refreshComments}
                disabled={refreshingComments}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingComments ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {(!post.comments || post.comments.length === 0) ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No comments yet</p>
                {post.status === 'published' && (
                  <p className="text-xs mt-1 text-gray-400">Click Refresh to check for new comments</p>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {post.comments
                  .filter(c => !c.repliedWith || true)
                  .map(comment => (
                  <div key={comment.id} className="p-5">
                    {/* Comment */}
                    <div className="flex items-start gap-3">
                      {comment.authorAvatar ? (
                        <Image src={comment.authorAvatar} alt="" width={36} height={36} className="w-9 h-9 rounded-full flex-shrink-0" unoptimized />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm flex-shrink-0">
                          {comment.authorName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.commentedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>

                        {/* Reply status */}
                        {comment.repliedWith && (
                          <div className="mt-3 ml-4 pl-4 border-l-2 border-[#0A66C2]/20">
                            <p className="text-xs text-gray-500 mb-1">Your reply · {comment.repliedAt && new Date(comment.repliedAt).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-700">{comment.repliedWith}</p>
                          </div>
                        )}

                        {/* Replies from Zernio */}
                        {comment.replies?.map(reply => (
                          <div key={reply.id} className="mt-3 ml-4 pl-4 border-l-2 border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">{reply.authorName}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(reply.commentedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">{reply.content}</p>
                          </div>
                        ))}

                        {/* Reply Actions */}
                        {!comment.repliedWith && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => generateAiReply(comment)}
                                disabled={generatingReply === comment.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50"
                              >
                                {generatingReply === comment.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Wand2 className="w-3 h-3" />
                                )}
                                AI Reply
                              </button>
                            </div>

                            {replyTexts[comment.id] !== undefined && (
                              <div className="flex items-start gap-2">
                                <textarea
                                  value={replyTexts[comment.id]}
                                  onChange={e => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                  className="flex-1 rounded-lg border border-gray-200 p-2.5 text-sm focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none resize-none min-h-[60px]"
                                  placeholder="Write a reply..."
                                />
                                <button
                                  onClick={() => sendReply(comment.id)}
                                  disabled={replyingTo === comment.id || !replyTexts[comment.id]?.trim()}
                                  className="px-3 py-2 rounded-lg text-white bg-[#0A66C2] hover:bg-[#004182] transition-colors disabled:opacity-50 flex-shrink-0"
                                >
                                  {replyingTo === comment.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
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
        </div>

        {/* Sidebar - Analytics */}
        <div className="space-y-4">
          {post.status === 'published' && (
            <div className="bg-white rounded-xl border">
              <div className="p-5 border-b">
                <h3 className="font-semibold text-gray-900">Post Performance</h3>
              </div>
              <div className="p-5 space-y-4">
                <MetricRow icon={<Eye className="w-4 h-4 text-blue-600" />} label="Impressions" value={post.impressions} />
                <MetricRow icon={<Heart className="w-4 h-4 text-red-500" />} label="Likes" value={post.likes} />
                <MetricRow icon={<MessageSquare className="w-4 h-4 text-green-600" />} label="Comments" value={post.commentCount} />
                <MetricRow icon={<Share2 className="w-4 h-4 text-purple-600" />} label="Shares" value={post.shares} />
                <MetricRow icon={<MousePointerClick className="w-4 h-4 text-amber-600" />} label="Clicks" value={post.clicks} />
                <MetricRow icon={<Eye className="w-4 h-4 text-teal-600" />} label="Reach" value={post.reach} />

                {post.impressions > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-1">Engagement Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {((post.likes + post.commentCount + post.shares + post.clicks) / post.impressions * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {post.aiGenerated && post.aiPrompt && (
            <div className="bg-white rounded-xl border">
              <div className="p-5 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI Details
                </h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Topic / Prompt</p>
                  <p className="text-gray-700">{post.aiPrompt}</p>
                </div>
                {post.aiTopicCategory && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <p className="text-gray-700">{post.aiTopicCategory}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/linkedin/compose"
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[#0A66C2] bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Create New Post
              </Link>
              <Link
                href="/linkedin/calendar"
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Clock className="w-4 h-4" /> View Calendar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        {label}
      </div>
      <span className="text-sm font-semibold text-gray-900">{value.toLocaleString()}</span>
    </div>
  );
}
