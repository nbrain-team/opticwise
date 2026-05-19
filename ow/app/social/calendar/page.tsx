'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Linkedin, Instagram,
  Clock, CheckCircle2, FileText, AlertCircle, Sparkles, Shield,
} from 'lucide-react';

interface Post {
  id: string;
  content: string;
  platform: string;
  status: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  aiGenerated: boolean;
  riskTier: string | null;
  socialAccount: {
    displayName: string | null;
    platform: string;
    accountType: string;
  } | null;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const days = getDaysInMonth(year, month);
  const firstDayOfWeek = days[0].getDay();
  const calendar: (Date | null)[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    calendar.push(null);
  }
  calendar.push(...days);

  while (calendar.length % 7 !== 0) {
    calendar.push(null);
  }

  return calendar;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

const STATUS_COLORS: Record<string, { bg: string; dot: string; text: string }> = {
  published: { bg: 'bg-green-50 hover:bg-green-100', dot: 'bg-green-500', text: 'text-green-800' },
  scheduled: { bg: 'bg-blue-50 hover:bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-800' },
  pending_approval: { bg: 'bg-amber-50 hover:bg-amber-100', dot: 'bg-amber-500', text: 'text-amber-800' },
  draft: { bg: 'bg-gray-50 hover:bg-gray-100', dot: 'bg-gray-400', text: 'text-gray-700' },
  failed: { bg: 'bg-red-50 hover:bg-red-100', dot: 'bg-red-500', text: 'text-red-700' },
  rejected: { bg: 'bg-red-50 hover:bg-red-100', dot: 'bg-red-400', text: 'text-red-600' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  if (platform === 'instagram') return <Instagram className={className || 'w-3 h-3 text-pink-500'} />;
  return <Linkedin className={className || 'w-3 h-3 text-blue-600'} />;
};

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/posts?perPage=200');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const calendarDays = getCalendarDays(currentYear, currentMonth);

  const getPostsForDate = (date: Date): Post[] => {
    return posts.filter(p => {
      const postDate = p.scheduledFor
        ? new Date(p.scheduledFor)
        : p.publishedAt
        ? new Date(p.publishedAt)
        : new Date(p.createdAt);
      return isSameDay(postDate, date);
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
      case 'scheduled': return <Clock className="w-3.5 h-3.5 text-blue-600" />;
      case 'pending_approval': return <Shield className="w-3.5 h-3.5 text-amber-600" />;
      case 'draft': return <FileText className="w-3.5 h-3.5 text-gray-500" />;
      case 'failed': return <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
      default: return null;
    }
  };

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const pendingCount = posts.filter(p => p.status === 'pending_approval').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const publishedCount = posts.filter(p => p.status === 'published').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/social" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Content Calendar</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-500 mr-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Published ({publishedCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Scheduled ({scheduledCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Pending ({pendingCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" /> Drafts ({draftCount})</span>
          </div>
          <Link
            href="/social/compose"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Post
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-xl border">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={goToToday} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Today
              </button>
              <button onClick={prevMonth} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map(day => (
              <div key={day} className="px-3 py-2 text-xs font-medium text-gray-500 text-center uppercase">
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((date, idx) => {
                if (!date) {
                  return <div key={idx} className="min-h-[100px] border-b border-r bg-gray-50/50" />;
                }

                const dayPosts = getPostsForDate(date);
                const isToday = isSameDay(date, today);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isPast = date < today && !isToday;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[100px] border-b border-r p-2 text-left transition-colors ${
                      isSelected ? 'bg-blue-50 ring-2 ring-blue-600 ring-inset' :
                      isToday ? 'bg-amber-50/50' :
                      isPast ? 'bg-gray-50/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      isToday ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' :
                      isPast ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayPosts.slice(0, 3).map(post => {
                        const colors = STATUS_COLORS[post.status] || STATUS_COLORS.draft;
                        return (
                          <div
                            key={post.id}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text} truncate`}
                          >
                            <PlatformIcon platform={post.platform} className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0`} />
                            <span className="truncate">{post.content.slice(0, 20)}</span>
                          </div>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <span className="text-[10px] text-gray-400 pl-1">+{dayPosts.length - 3} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border sticky top-20">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Select a Day'}
              </h3>
              {selectedDate && (
                <p className="text-xs text-gray-500 mt-1">{selectedDatePosts.length} post{selectedDatePosts.length !== 1 ? 's' : ''}</p>
              )}
            </div>

            {selectedDate ? (
              <div className="divide-y">
                {selectedDatePosts.length === 0 ? (
                  <div className="p-6 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No posts on this day</p>
                    <Link
                      href="/social/compose"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Post
                    </Link>
                  </div>
                ) : (
                  selectedDatePosts.map(post => (
                    <Link
                      key={post.id}
                      href={`/social/posts/${post.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <PlatformIcon platform={post.platform} />
                        {statusIcon(post.status)}
                        <span className="text-xs font-medium capitalize text-gray-600">{post.status.replace('_', ' ')}</span>
                        {post.aiGenerated && <Sparkles className="w-3 h-3 text-purple-500" />}
                        {post.riskTier === 'high' && <Shield className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {post.socialAccount && (
                          <span className="text-[10px] text-gray-400">
                            {post.socialAccount.displayName}
                          </span>
                        )}
                        {post.scheduledFor && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(post.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">
                Click a day on the calendar to see posts
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-medium text-purple-900">Pro Tip</h4>
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              LinkedIn posts get the most engagement on <strong>Tuesdays through Thursdays</strong> between
              <strong> 8-10 AM</strong> and <strong>12-1 PM</strong>. Instagram Reels perform best on
              <strong> Mondays and Thursdays</strong> at <strong>11 AM</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
