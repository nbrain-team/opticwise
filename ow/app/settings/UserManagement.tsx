"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  department: string | null;
  isActive: boolean;
  emailSyncEnabled: boolean;
  lastEmailSync: string | null;
  emailSyncStatus: string | null;
  allowedModules: string[];
  createdAt: Date;
};

type UserManagementProps = {
  currentUser: User;
  users: User[];
};

const DEPARTMENTS = [
  { value: "", label: "Select department" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "ops", label: "Operations" },
  { value: "sales", label: "Sales" },
  { value: "engineering", label: "Engineering" },
  { value: "executive", label: "Executive" },
];

const AVAILABLE_MODULES = [
  { key: "deals", label: "Deals", description: "CRM deal pipeline" },
  { key: "contacts", label: "Contacts", description: "People management" },
  { key: "organizations", label: "Organizations", description: "Company records" },
  { key: "sales-inbox", label: "Sales Inbox", description: "Email tracking" },
  { key: "ownet-agent", label: "OWnet Agent", description: "AI sales assistant" },
  { key: "cs-agent", label: "CS Agent", description: "Customer support AI" },
  { key: "social", label: "Social", description: "Social media posting" },
  { key: "meeting-transcripts", label: "Transcripts", description: "Meeting recordings" },
  { key: "conferences", label: "Conferences", description: "Event management" },
  { key: "campaigns", label: "Campaigns", description: "Marketing campaigns" },
  { key: "forms", label: "Forms", description: "Lead capture forms" },
  { key: "blog", label: "Blog Publisher", description: "Blog content" },
  { key: "content-engine", label: "Content Engine", description: "AI content tools" },
  { key: "knowledge-base", label: "Knowledge Base", description: "Training docs" },
  { key: "audit-tool", label: "Audit Tool", description: "Property audits" },
];

export function UserManagement({ currentUser, users }: UserManagementProps) {
  const router = useRouter();
  const [showAddUser, setShowAddUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    department: "",
    role: "user",
    newPassword: "",
    allowedModules: [] as string[],
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function formatDate(date: Date | string) {
    if (!mounted) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    department: "",
  });

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add user");
      }

      setFormData({ email: "", name: "", password: "", department: "" });
      setShowAddUser(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add user");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleEmailSync(userId: string, currentlyEnabled: boolean) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSyncEnabled: !currentlyEnabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update email sync");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update email sync");
    }
  }

  async function handleSyncNow(userId: string) {
    try {
      const res = await fetch("/api/sales-inbox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hoursBack: 168 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to trigger sync");
      }

      alert("Sync complete!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to trigger sync");
    }
  }

  function openEditUser(user: User) {
    setEditUser(user);
    setEditData({
      name: user.name || "",
      email: user.email,
      department: user.department || "",
      role: user.role,
      newPassword: "",
      allowedModules: user.allowedModules || [],
    });
    setEditError(null);
    setEditSuccess(null);
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        name: editData.name,
        email: editData.email,
        department: editData.department,
        role: editData.role,
        allowedModules: editData.allowedModules,
      };
      if (editData.newPassword) {
        payload.newPassword = editData.newPassword;
      }

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }

      const data = await res.json();
      const messages = ["User updated successfully."];
      if (data.passwordReset) messages.push("Password has been reset.");
      setEditSuccess(messages.join(" "));
      setEditData(prev => ({ ...prev, newPassword: "" }));

      router.refresh();
      setTimeout(() => {
        setEditUser(null);
        setEditSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <p className="mt-1 text-sm text-gray-600">
            Click on any user to edit their profile, role, or reset their password
          </p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-[#3B6B8F] text-white px-4 py-2 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
        >
          + Add User
        </button>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUser.id;
          return (
            <div
              key={user.id}
              onClick={() => openEditUser(user)}
              className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-all hover:border-[#3B6B8F] hover:shadow-sm ${
                !user.isActive ? "bg-gray-50 opacity-70" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Left: User Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                    user.role === "admin" ? "bg-[#3B6B8F]" : "bg-gray-400"
                  }`}>
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>

                  {/* Name + Email */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {user.name || "No name"}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">YOU</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate">{user.email}</div>
                  </div>
                </div>

                {/* Center: Tags */}
                <div className="hidden md:flex items-center gap-2 mx-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {user.role === "admin" ? "Admin" : "User"}
                  </span>
                  {user.department && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {user.department}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Right: Email Sync + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Email Sync Toggle */}
                  {user.email.endsWith("@opticwise.com") && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider hidden lg:inline">Sync</span>
                      <button
                        onClick={() => handleToggleEmailSync(user.id, user.emailSyncEnabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          user.emailSyncEnabled ? "bg-[#3B6B8F]" : "bg-gray-300"
                        }`}
                        title={user.emailSyncEnabled ? "Disable email sync" : "Enable email sync"}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          user.emailSyncEnabled ? "translate-x-4" : "translate-x-1"
                        }`} />
                      </button>
                      {user.emailSyncEnabled && (
                        <button
                          onClick={() => handleSyncNow(user.id)}
                          className="text-xs text-[#3B6B8F] hover:underline"
                        >
                          Sync
                        </button>
                      )}
                      {user.lastEmailSync && user.emailSyncStatus === "error" && (
                        <span className="text-[10px] text-red-500">Error</span>
                      )}
                    </div>
                  )}

                  {/* Edit indicator */}
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>

              {/* Mobile tags */}
              <div className="flex md:hidden items-center gap-2 mt-3 pl-14">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {user.role === "admin" ? "Admin" : "User"}
                </span>
                {user.department && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {user.department}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editUser.name || editUser.email}
                </p>
              </div>
              <button
                onClick={() => { setEditUser(null); setEditError(null); setEditSuccess(null); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {editSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editSuccess}
                </div>
              )}

              {editError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditUser} className="space-y-5">
                {/* Name + Email side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm"
                      placeholder="user@opticwise.com"
                    />
                  </div>
                </div>

                {/* Role + Department side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                      disabled={editUser.id === currentUser.id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                    {editUser.id === currentUser.id && (
                      <p className="mt-1 text-xs text-gray-400">Cannot change your own role</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={editData.department}
                      onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password Reset */}
                <div className="border-t border-gray-200 pt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reset Password
                    <span className="text-gray-400 font-normal ml-1">(leave blank to keep current)</span>
                  </label>
                  <input type="text" name="username" autoComplete="username" value={editUser.email} readOnly hidden aria-hidden="true" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={editData.newPassword}
                    onChange={(e) => setEditData({ ...editData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm"
                    placeholder="New password (min. 8 characters)"
                    minLength={8}
                  />
                </div>

                {/* Status + Joined info */}
                <div className="border-t border-gray-200 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Joined {formatDate(editUser.createdAt)}
                    </div>
                    <div className="flex items-center gap-4">
                      {editUser.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(editUser.id, editUser.name || editUser.email)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete User
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setEditUser(null); setEditError(null); setEditSuccess(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
              <button
                onClick={() => { setShowAddUser(false); setError(null); setFormData({ email: "", name: "", password: "", department: "" }); }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-4">
                <input type="text" name="username" autoComplete="username" value={formData.email} readOnly hidden aria-hidden="true" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm"
                      placeholder="user@opticwise.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temporary Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm"
                      placeholder="Min. 8 characters"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent text-sm"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUser(false);
                      setError(null);
                      setFormData({ email: "", name: "", password: "", department: "" });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading ? "Adding..." : "Add User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
