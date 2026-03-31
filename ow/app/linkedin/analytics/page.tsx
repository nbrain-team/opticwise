'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Linkedin, Eye, Heart, MessageSquare, Share2,
  TrendingUp, FileText, Sparkles,
  BarChart3, Users,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface AnalyticsData {
  summary: {
    totalPosts: number;
    scheduledCount: number;
    draftCount: number;
    totalImpressions: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalClicks: number;
    totalReach: number;
    engagementRate: number;
  };
  posts: Array<{
    id: string;
    content: string;
    publishedAt: string | null;
    impressions: number;
    likes: number;
    commentCount: number;
    shares: number;
    clicks: number;
    reach: number;
    aiGenerated: boolean;
  }>;
  dateRange: { fromDate: string; toDate: string };
}


export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/linkedin/analytics?fromDate=${fromDate}&toDate=${toDate}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A66C2]" />
      </div>
    );
  }

  const summary = data?.summary;
  const posts = data?.posts || [];

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

  const engagementBreakdown = summary ? [
    { name: 'Likes', value: summary.totalLikes, color: '#FF6B6B' },
    { name: 'Comments', value: summary.totalComments, color: '#2EC4B6' },
    { name: 'Shares', value: summary.totalShares, color: '#C77DFF' },
    { name: 'Clicks', value: summary.totalClicks, color: '#FFB703' },
  ].filter(d => d.value > 0) : [];

  const aiVsManual = posts.length > 0 ? [
    { name: 'AI Generated', value: posts.filter(p => p.aiGenerated).length, color: '#C77DFF' },
    { name: 'Manual', value: posts.filter(p => !p.aiGenerated).length, color: '#0A66C2' },
  ] : [];

  const topPosts = [...posts]
    .sort((a, b) => (b.impressions + b.likes + b.commentCount) - (a.impressions + a.likes + a.commentCount))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/linkedin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#0A66C2] outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#0A66C2] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <MetricCard icon={<FileText className="w-5 h-5" />} label="Posts" value={summary.totalPosts} color="text-blue-600" bg="bg-blue-50" />
          <MetricCard icon={<Eye className="w-5 h-5" />} label="Impressions" value={formatLargeNum(summary.totalImpressions)} color="text-purple-600" bg="bg-purple-50" />
          <MetricCard icon={<Users className="w-5 h-5" />} label="Reach" value={formatLargeNum(summary.totalReach)} color="text-teal-600" bg="bg-teal-50" />
          <MetricCard icon={<Heart className="w-5 h-5" />} label="Likes" value={formatLargeNum(summary.totalLikes)} color="text-red-500" bg="bg-red-50" />
          <MetricCard icon={<MessageSquare className="w-5 h-5" />} label="Comments" value={formatLargeNum(summary.totalComments)} color="text-green-600" bg="bg-green-50" />
          <MetricCard icon={<Share2 className="w-5 h-5" />} label="Shares" value={formatLargeNum(summary.totalShares)} color="text-purple-600" bg="bg-purple-50" />
          <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="Eng. Rate" value={`${summary.engagementRate}%`} color="text-amber-600" bg="bg-amber-50" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Performance Chart */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0A66C2]" />
            Post Performance
          </h3>
          {postEngagementData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={postEngagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
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
                  <Pie
                    data={engagementBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
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
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              No engagement data yet
            </div>
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
                  href={`/linkedin/posts/${post.id}`}
                  className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-bold text-gray-300 w-6 text-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
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

        {/* AI vs Manual */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">AI vs Manual Posts</h3>
          {aiVsManual.some(d => d.value > 0) ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={aiVsManual}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {aiVsManual.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {aiVsManual.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No posts yet
            </div>
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
