import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function OrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    include: {
      people: true,
      deals: {
        where: { status: "open" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C]">Organizations</h1>
          <div className="text-sm text-gray-500 mt-1">{organizations.length} organizations</div>
        </div>
        <Link href="/contacts" className="text-sm text-[#3B6B8F] hover:underline">
          View Contacts →
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Industry</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Address</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Website</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">LinkedIn</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Employees</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Doors</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">People</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Open Deals</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Labels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/organization/${org.id}`}
                      className="font-medium text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors"
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {org.industry || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={org.address || undefined}>
                    {org.address || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {org.websiteUrl ? (
                      <a 
                        href={org.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#3B6B8F] hover:underline inline-flex items-center gap-1"
                      >
                        <span className="max-w-[150px] truncate">{org.domain || org.websiteUrl}</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {org.linkedInProfile ? (
                      <a 
                        href={org.linkedInProfile} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#3B6B8F] hover:underline inline-flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {org.numberOfEmployees || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {org.doors || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {org.people.length}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {org.deals.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {org.labels || "-"}
                  </td>
                </tr>
              ))}
              {organizations.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    No organizations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Organizations</div>
          <div className="text-2xl font-semibold text-[#3B6B8F]">{organizations.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">With Website</div>
          <div className="text-2xl font-semibold text-[#3B6B8F]">
            {organizations.filter(o => o.websiteUrl).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">With LinkedIn</div>
          <div className="text-2xl font-semibold text-[#3B6B8F]">
            {organizations.filter(o => o.linkedInProfile).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Contacts</div>
          <div className="text-2xl font-semibold text-[#3B6B8F]">
            {organizations.reduce((sum, o) => sum + o.people.length, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
