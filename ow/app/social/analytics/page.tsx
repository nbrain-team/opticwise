'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Linkedin, Instagram, Eye, Heart, MessageSquare, Share2,
  TrendingUp, FileText, Sparkles, BarChart3, Users,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface AnalyticsResponse {
  period: { days: number; since: string };
  totals: {
    posts: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    reach: number;
  };
  byAccount: Array<{
    account: { id: string; displayName: string | null; platform: string; accountType: string };
    posts: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    reach: number;
  }>;
  postCount: number;
}

interface PostData {
  id: string;
  content: string;
  platform: string;
  publishedAt: string | null;
  impressions: number;
  likes: number;
  commentCount: number;
  shares: number;
  clicks: number;
  reach: number;
  aiGenerated: boolean;
  socialAccount: { displayName: string | null; platform: string } | null;
}

const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  if (platform === 'instagram') return <Instagram className={className || 'w-4 h-4 text-pink-500'} />;
  return <Linkedin className={className || 'w-4 h-4 text-blue-600'} />;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (platformFilter !== 'all') params.set('platform', platformFilter);

      const [analyticsRes, postsRes] = await Promise.all([
        fetch(`/api/social/analytics?${params}`),
        fetch(`/api/social/posts?status=published&perPage=50&${platformFilter !== 'all' ? `platform=${platformFilter}` : ''}`),
      ]);

      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [days, platformFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const totals = analytics?.totals;

  const engagementRate = totals && totals.impressions > 0
    ? (((totals.likes + totals.comments + totals.shares) / totals.impressions) * 100).toFixed(1)
    : '0.0';

  const postEngagementData = posts
    .filter(p => p.publishedAt)
    .slice(0, 15)
    .map(p => ({
      name: p.content.slice(0, 20) + '...',
      impressions: p.impressions,
      likes: p.likes,
      comments: p.commentCount,
      shares: p.shares,
      clicks: p.clicks,
    }));

  const engagementBreakdown = totals ? [
    { name: 'Likes', value: totals.likes, color: '#FF6B6B' },
    { name: 'Comments', value: totals.comments, color: '#2EC4B6' },
    { name: 'Shares', value: totals.shares, color: '#C77DFF' },
    { name: 'Clicks', value: totals.clicks, color: '#FFB703' },
  ].filter(d => d.value > 0) : [];

  const platformBreakdown = analytics?.byAccount.map(a => ({
    name: `${a.account.displayName || 'Unknown'} (${a.account.platform})`,
    value: a.posts,
    color: a.account.platform === 'instagram' ? '#E1306C' : '#0A66C2',
  })) || [];

  const topPosts = [...posts]
    .sort((a, b) => (b.impressions + b.likes + b.commentCount) - (a.impressions + a.likes + a.commentCount))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/social" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Social Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
          >
            <option value="all">All Platforms</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
          </select>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <MetricCard icon={<FileText className="w-5 h-5" />} label="Posts" value={totals.posts} color="text-blue-600" bg="bg-blue-50" />
          <MetricCard icon={<Eye className="w-5 h-5" />} label="Impressions" value={formatLargeNum(totals.impressions)} color="text-purple-600" bg="bg-purple-50" />
          <MetricCard icon={<Users className="w-5 h-5" />} label="Reach" value={formatLargeNum(totals.reach)} color="text-teal-600" bg="bg-teal-50" />
          <MetricCard icon={<Heart className="w-5 h-5" />} label="Likes" value={formatLargeNum(totals.likes)} color="text-red-500" bg="bg-red-50" />
          <MetricCard icon={<MessageSquare className="w-5 h-5" />} label="Comments" value={formatLargeNum(totals.comments)} color="text-green-600" bg="bg-green-50" />
          <MetricCard icon={<Share2 className="w-5 h-5" />} label="Shares" value={formatLargeNum(totals.shares)} color="text-purple-600" bg="bg-purple-50" />
          <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="Eng. Rate" value={`${engagementRate}%`} color="text-amber-600" bg="bg-amber-50" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Performance Chart */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Post Performance
          </h3>
          {postEngagementData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={postEngagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="impressions" fill="#0A66C2" radius={[4, 4, 0, 0]} name="Impressions" />
                <Bar dataKey="likes" fill="#FF6B6B" radius={[4, 4, 0, 0]} name="Likes" />
                <Bar dataKey="comments" fill="#2EC4B6" radius={[4, 4, 0, 0]} name="Comments" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
              No published posts in this period
            </div>
          )}
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Engagement Breakdown</h3>
          {engagementBreakdown.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie data={engagementBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                    {engagementBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {engagementBreakdown.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">No engagement data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Posts */}
        <div className="lg:col-span-2 bg-white rounded-xl border">
          <div className="p-5 border-b">
            <h3 className="font-semibold text-gray-900">Top Performing Posts</h3>
          </div>
          {topPosts.length > 0 ? (
            <div className="divide-y">
              {topPosts.map((post, idx) => (
                <Link
                  key={post.id}
                  href={`/social/posts/${post.id}`}
                  className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-bold text-gray-300 w-6 text-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <PlatformIcon platform={post.platform} className="w-3.5 h-3.5" />
                      {post.socialAccount && (
                        <span className="text-xs text-gray-400">{post.socialAccount.displayName}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2 mb-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.impressions}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.commentCount}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {post.shares}</span>
                      {post.aiGenerated && <Sparkles className="w-3 h-3 text-purple-500" />}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No published posts yet</div>
          )}
        </div>

        {/* By Account */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Posts by Account</h3>
          {platformBreakdown.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={platformBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                    {platformBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {platformBreakdown.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600 truncate">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No posts yet</div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-medium text-purple-900">AI Insight</h4>
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              AI-generated posts often achieve higher engagement when they combine
              thought leadership with personal stories. Try using the &ldquo;Story&rdquo;
              post type with industry-specific topics for maximum impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function formatLargeNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}
