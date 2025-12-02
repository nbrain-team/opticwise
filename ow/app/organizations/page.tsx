import { prisma } from "@/lib/db";
import Link from "next/link";
import { OrganizationsTable } from "./OrganizationsTable";

export default async function OrganizationsPage({
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
          { domain: { contains: search, mode: "insensitive" as const } },
          { industry: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
          { state: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [organizations, totalCount] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        people: {
          select: { id: true },
        },
        deals: {
          where: { status: "open" },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
      take: perPage,
      skip,
    }),
    prisma.organization.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  // Serialize the data for client component
  const serializedOrganizations = organizations.map(org => ({
    ...org,
    nextActivityDate: org.nextActivityDate?.toISOString() || null,
    lastActivityDate: org.lastActivityDate?.toISOString() || null,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  }));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C]">Organizations</h1>
          <div className="text-sm text-gray-500 mt-1">
            Showing {skip + 1}-{Math.min(skip + perPage, totalCount)} of {totalCount} organizations
          </div>
        </div>
        <Link href="/contacts" className="text-sm text-[#3B6B8F] hover:underline">
          View Contacts →
        </Link>
      </div>

      {/* Search Bar */}
      <form method="GET" className="flex gap-2">
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search organizations by name, domain, industry, city, or state..."
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
            href="/organizations"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      <OrganizationsTable organizations={serializedOrganizations} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/organizations?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/organizations?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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
