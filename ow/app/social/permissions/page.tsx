'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Users, Shield, Plus, Trash2, Linkedin, Instagram,
  CheckCircle2, AlertCircle,
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'linkedin' | 'instagram';
  displayName: string;
  accountType: string;
  isConnected: boolean;
}

interface Permission {
  id: string;
  role: string;
  grantedAt: string;
  user: { id: string; name: string | null; email: string };
}

interface TeamUser {
  id: string;
  name: string | null;
  email: string;
}

const PLATFORM_META = {
  linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
  instagram: { icon: Instagram, color: '#E1306C', label: 'Instagram' },
} as const;

export default function PermissionsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [allUsers, setAllUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState('poster');

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0 && !selectedAccount) {
          setSelectedAccount(data.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  const fetchPermissions = useCallback(async (accountId: string) => {
    try {
      const res = await fetch(`/api/social/accounts/${accountId}/permissions`);
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || []);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchUsers();
  }, [fetchAccounts, fetchUsers]);

  useEffect(() => {
    if (selectedAccount) {
      fetchPermissions(selectedAccount);
    }
  }, [selectedAccount, fetchPermissions]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleGrant = async () => {
    if (!selectedAccount || !addUserId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/social/accounts/${selectedAccount}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: addUserId, role: addRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to grant permission');
      }
      setToast({ type: 'success', message: 'Permission granted successfully' });
      setAddUserId('');
      fetchPermissions(selectedAccount);
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (userId: string, userName: string) => {
    if (!selectedAccount) return;
    if (!confirm(`Revoke posting access for ${userName}?`)) return;
    try {
      const res = await fetch(`/api/social/accounts/${selectedAccount}/permissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to revoke');
      }
      setToast({ type: 'success', message: 'Permission revoked' });
      fetchPermissions(selectedAccount);
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const existingUserIds = new Set(permissions.map((p) => p.user.id));
  const availableUsers = allUsers.filter((u) => !existingUserIds.has(u.id));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const selectedAcct = accounts.find((a) => a.id === selectedAccount);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/social" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Team Permissions</h1>
          <p className="text-sm text-gray-500">Control who can post to your connected social accounts</p>
        </div>
      </div>

      {toast && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-green-600" />
            : <AlertCircle className="w-5 h-5 text-red-600" />}
          <p className={`text-sm ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Account Selector */}
      <div className="bg-white rounded-xl border p-5">
        <label className="text-sm font-medium text-gray-700 block mb-2">Select Account</label>
        <div className="flex flex-wrap gap-2">
          {accounts.map((acct) => {
            const meta = PLATFORM_META[acct.platform];
            const Icon = meta.icon;
            const isSelected = acct.id === selectedAccount;
            return (
              <button
                key={acct.id}
                onClick={() => setSelectedAccount(acct.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon style={{ width: 16, height: 16, color: meta.color }} />
                {acct.displayName}
                <span className="text-xs text-gray-400 capitalize">({acct.accountType})</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedAcct && (
        <>
          {/* Current Permissions */}
          <div className="bg-white rounded-xl border">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Users with access to {selectedAcct.displayName}
              </h2>
            </div>
            {permissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No team members have been granted access yet.</p>
                <p className="text-xs text-gray-400 mt-1">Only the account owner can post. Add team members below.</p>
              </div>
            ) : (
              <div className="divide-y">
                {permissions.map((perm) => (
                  <div key={perm.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{perm.user.name || perm.user.email}</p>
                      <p className="text-xs text-gray-500">{perm.user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        perm.role === 'poster'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {perm.role === 'poster' ? 'Can Post' : 'View Only'}
                      </span>
                      <button
                        onClick={() => handleRevoke(perm.user.id, perm.user.name || perm.user.email)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Permission */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Grant Access to Team Member
            </h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-1">Team Member</label>
                <select
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white"
                >
                  <option value="">Select a team member...</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white"
                >
                  <option value="poster">Can Post</option>
                  <option value="viewer">View Only</option>
                </select>
              </div>
              <button
                onClick={handleGrant}
                disabled={!addUserId || saving}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Granting...' : 'Grant Access'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
