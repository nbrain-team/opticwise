import { prisma } from "@/lib/db";
import Link from "next/link";
import { ContactsTable } from "./ContactsTable";

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
          { city: { contains: search, mode: "insensitive" as const } },
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

  // Serialize the data for client component
  const serializedPeople = people.map(person => ({
    ...person,
    birthday: person.birthday?.toISOString() || null,
    nextActivityDate: person.nextActivityDate?.toISOString() || null,
    lastActivityDate: person.lastActivityDate?.toISOString() || null,
    lastEmailReceived: person.lastEmailReceived?.toISOString() || null,
    lastEmailSent: person.lastEmailSent?.toISOString() || null,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
    deals: person.deals.map(deal => ({
      ...deal,
      value: deal.value.toString(),
      addTime: deal.addTime.toISOString(),
      updateTime: deal.updateTime.toISOString(),
      expectedCloseDate: deal.expectedCloseDate?.toISOString() || null,
      wonTime: deal.wonTime?.toISOString() || null,
      lostTime: deal.lostTime?.toISOString() || null,
      nextActivityDate: deal.nextActivityDate?.toISOString() || null,
      lastActivityDate: deal.lastActivityDate?.toISOString() || null,
      lastEmailReceived: deal.lastEmailReceived?.toISOString() || null,
      lastEmailSent: deal.lastEmailSent?.toISOString() || null,
      productAmount: deal.productAmount?.toString() || null,
      mrr: deal.mrr?.toString() || null,
      arr: deal.arr?.toString() || null,
      acv: deal.acv?.toString() || null,
      arrForecast: deal.arrForecast?.toString() || null,
      capexRom: deal.capexRom?.toString() || null,
      auditValue: deal.auditValue?.toString() || null,
      arrExpansionPotential: deal.arrExpansionPotential?.toString() || null,
    })),
  }));

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
          placeholder="Search contacts by name, email, city, or organization..."
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

      <ContactsTable people={serializedPeople} />

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
