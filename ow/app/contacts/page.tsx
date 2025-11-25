import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parseInt((params.page as string) || "1");
  const search = (params.search as string) || "";
  const perPage = 100;
  const skip = (page - 1) * perPage;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { organization: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [people, totalCount] = await Promise.all([
    prisma.person.findMany({
      where,
      include: {
        organization: true,
        deals: {
          where: { status: "open" },
        },
      },
      orderBy: { lastName: "asc" },
      take: perPage,
      skip,
    }),
    prisma.person.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C]">Contacts</h1>
          <div className="text-sm text-gray-500 mt-1">
            Showing {skip + 1}-{Math.min(skip + perPage, totalCount)} of {totalCount} people
          </div>
        </div>
        <Link href="/organizations" className="text-sm text-[#3B6B8F] hover:underline">
          View Organizations →
        </Link>
      </div>

      {/* Search Bar */}
      <form method="GET" className="flex gap-2">
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search contacts by name, email, or organization..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent transition-all"
        />
        <button
          type="submit"
          className="btn-primary"
        >
          Search
        </button>
        {search && (
          <Link
            href="/contacts"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Title</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Email (Work)</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Phone (Work)</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Phone (Mobile)</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Organization</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Contact Type</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Open Deals</th>
                <th className="text-left px-6 py-3 font-semibold text-[#2E2E2F]">Labels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {people.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/person/${person.id}`}
                      className="font-medium text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors"
                    >
                      {person.name || `${person.firstName} ${person.lastName}`}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {person.title || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {person.emailWork || person.email ? (
                      <a href={`mailto:${person.emailWork || person.email}`} className="text-[#3B6B8F] hover:underline">
                        {person.emailWork || person.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {person.phoneWork || person.phone ? (
                      <a href={`tel:${person.phoneWork || person.phone}`} className="text-[#3B6B8F] hover:underline">
                        {person.phoneWork || person.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {person.phoneMobile ? (
                      <a href={`tel:${person.phoneMobile}`} className="text-[#3B6B8F] hover:underline">
                        {person.phoneMobile}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {person.organization ? (
                      <Link
                        href={`/organization/${person.organization.id}`}
                        className="text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors"
                      >
                        {person.organization.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {person.contactType || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {person.deals.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {person.labels || "-"}
                  </td>
                </tr>
              ))}
              {people.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/contacts?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/contacts?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
