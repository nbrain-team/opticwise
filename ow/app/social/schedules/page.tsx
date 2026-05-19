'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Calendar, Clock, Trash2, Linkedin,
  Instagram, ToggleLeft, ToggleRight, Save,
} from 'lucide-react';

interface Schedule {
  id: string;
  deliverableType: string;
  targetAccountId: string;
  cadence: { frequency?: string; days?: string[] };
  defaultPostTime: string;
  timezone: string;
  isActive: boolean;
  targetAccount: {
    id: string;
    displayName: string | null;
    platform: string;
    accountType: string;
    avatarUrl: string | null;
  };
}

interface Account {
  id: string;
  displayName: string | null;
  platform: string;
  accountType: string;
}

const DELIVERABLE_TYPES = [
  { value: 'linkedinArticle', label: 'LinkedIn Long-form Article' },
  { value: 'linkedinPost', label: 'LinkedIn Short Post' },
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const TIMEZONES = [
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newType, setNewType] = useState('linkedinArticle');
  const [newAccountId, setNewAccountId] = useState('');
  const [newDays, setNewDays] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('08:00');
  const [newTz, setNewTz] = useState('America/Denver');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, acctRes] = await Promise.all([
        fetch('/api/social/schedules'),
        fetch('/api/social/accounts'),
      ]);
      if (schedRes.ok) {
        const data = await schedRes.json();
        setSchedules(data.schedules || []);
      }
      if (acctRes.ok) {
        const data = await acctRes.json();
        setAccounts(data.accounts || data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddSchedule() {
    if (!newAccountId || newDays.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/social/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverableType: newType,
          targetAccountId: newAccountId,
          cadence: { frequency: 'weekly', days: newDays },
          defaultPostTime: newTime,
          timezone: newTz,
          isActive: true,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewDays([]);
        fetchData();
      }
    } catch (err) {
      console.error('Create schedule error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(schedule: Schedule) {
    try {
      await fetch(`/api/social/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      });
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, isActive: !s.isActive } : s
        )
      );
    } catch (err) {
      console.error('Toggle error:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this schedule?')) return;
    try {
      await fetch(`/api/social/schedules/${id}`, { method: 'DELETE' });
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  function toggleDay(day: string) {
    setNewDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  const PlatformIcon = ({ platform }: { platform: string }) =>
    platform === 'instagram' ? (
      <Instagram className="w-4 h-4 text-pink-500" />
    ) : (
      <Linkedin className="w-4 h-4 text-blue-600" />
    );

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Deliverable Schedules</h1>
                <p className="text-sm text-gray-500">
                  Map Content Engine deliverables to posting surfaces and times
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Schedule
            </button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <h2 className="font-medium text-gray-900 mb-4">New Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deliverable Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                >
                  {DELIVERABLE_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Account
                </label>
                <select
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                >
                  <option value="">Select account...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName || a.id} ({a.platform} - {a.accountType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      newDays.includes(day)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={newTz}
                  onChange={(e) => setNewTz(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddSchedule}
                disabled={!newAccountId || newDays.length === 0 || saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Create Schedule'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Schedule list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No schedules configured yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Add a schedule to route Content Engine deliverables to your social accounts.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Deliverable
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Target Account
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Schedule
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Active
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.map((sched) => (
                  <tr key={sched.id} className={!sched.isActive ? 'opacity-50' : ''}>
                    <td className="px-5 py-3 text-sm text-gray-900">
                      {DELIVERABLE_TYPES.find((dt) => dt.value === sched.deliverableType)?.label ||
                        sched.deliverableType}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <PlatformIcon platform={sched.targetAccount.platform} />
                        <span className="text-gray-900">
                          {sched.targetAccount.displayName || sched.targetAccountId}
                        </span>
                        <span className="text-xs text-gray-400">
                          {sched.targetAccount.accountType}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {(sched.cadence.days || [])
                        .map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3))
                        .join(', ') || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {sched.defaultPostTime} {sched.timezone.split('/')[1]}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggleActive(sched)}>
                        {sched.isActive ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(sched.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
