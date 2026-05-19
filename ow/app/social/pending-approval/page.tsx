'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Shield, CheckCircle2, XCircle, Clock,
  AlertTriangle, Linkedin, Instagram, Eye, Send,
  ChevronDown, ChevronUp, MessageSquare,
} from 'lucide-react';

interface PendingPost {
  id: string;
  content: string;
  platform: string;
  status: string;
  scheduledFor: string | null;
  riskTier: string | null;
  riskReason: string | null;
  aiGenerated: boolean;
  aiTopicCategory: string | null;
  createdAt: string;
  socialAccount: {
    id: string;
    displayName: string | null;
    platform: string;
    accountType: string;
    avatarUrl: string | null;
  } | null;
}

export default function PendingApprovalPage() {
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/posts?status=pending_approval&perPage=100');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Fetch pending posts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  async function handleApprove(postId: string) {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/social/posts/${postId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(postId: string) {
    if (!rejectReason.trim()) return;
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/social/posts/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setRejectingId(null);
        setRejectReason('');
      }
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(null);
    }
  }

  const PlatformIcon = ({ platform }: { platform: string }) => {
    if (platform === 'instagram') return <Instagram className="w-4 h-4 text-pink-500" />;
    return <Linkedin className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/social"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Social
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pending Approval</h1>
              <p className="text-sm text-gray-500">
                {posts.length} post{posts.length !== 1 ? 's' : ''} flagged for review
              </p>
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">All clear! No posts pending approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <div className="px-5 py-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {post.socialAccount?.avatarUrl ? (
                      <img
                        src={post.socialAccount.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
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
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                          {post.socialAccount?.accountType === 'company_page' ? 'Company' : 'Personal'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {post.scheduledFor && (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>
                              Scheduled for{' '}
                              {new Date(post.scheduledFor).toLocaleString()}
                            </span>
                          </>
                        )}
                        {post.aiGenerated && (
                          <span className="text-purple-500">AI Generated</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setExpandedId(expandedId === post.id ? null : post.id)
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedId === post.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Risk reasons */}
                {post.riskReason && (
                  <div className="px-5 pb-3">
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-800">
                        <span className="font-medium">Risk flags: </span>
                        {post.riskReason}
                      </div>
                    </div>
                  </div>
                )}

                {/* Content preview / full */}
                <div className="px-5 pb-4">
                  <div
                    className={`text-sm text-gray-700 whitespace-pre-wrap ${
                      expandedId !== post.id ? 'line-clamp-4' : ''
                    }`}
                  >
                    {post.content}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                  {rejectingId === post.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReject(post.id)}
                        disabled={
                          !rejectReason.trim() || actionLoading === post.id
                        }
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason('');
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(post.id)}
                        disabled={actionLoading === post.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Schedule
                      </button>
                      <Link
                        href={`/social/compose?edit=${post.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Edit & Schedule
                      </Link>
                      <button
                        onClick={() => setRejectingId(post.id)}
                        disabled={actionLoading === post.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
