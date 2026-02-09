import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { UserManagement } from "./UserManagement";
import { ChangePassword } from "./ChangePassword";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get current user with full details
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!currentUser) {
    redirect("/login");
  }

  // Get all users if admin
  const allUsers = currentUser.role === "admin" 
    ? await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your profile and team members
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg border border-gray-200 p-4 space-y-1">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Settings
              </div>
              <a
                href="#profile"
                className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                Profile
              </a>
              <a
                href="#password"
                className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                Change Password
              </a>
              {currentUser.role === "admin" && (
                <a
                  href="#team"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  Team Members
                </a>
              )}
            </nav>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Section */}
            <div id="profile" className="bg-white rounded-lg border border-gray-200 p-6 scroll-mt-20">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="text-gray-900">{currentUser.name || "Not set"}</div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="text-gray-900">{currentUser.email}</div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {currentUser.role === "admin" ? "Administrator" : "User"}
                  </div>
                </div>

                {/* Department */}
                {currentUser.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <div className="text-gray-900 capitalize">{currentUser.department}</div>
                  </div>
                )}

                {/* Member Since */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <div className="text-gray-900">
                    {new Date(currentUser.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div id="password" className="scroll-mt-20">
              <ChangePassword />
            </div>

            {/* Team Members Section - Admin Only */}
            {currentUser.role === "admin" && (
              <div id="team" className="bg-white rounded-lg border border-gray-200 p-6 scroll-mt-20">
                <UserManagement currentUser={currentUser} users={allUsers} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
