import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      people: {
        orderBy: { lastName: "asc" },
      },
      deals: {
        include: {
          stage: true,
          owner: true,
        },
        orderBy: { updateTime: "desc" },
      },
    },
  });

  if (!org) {
    return notFound();
  }

  const openDeals = org.deals.filter((d) => d.status === "open");
  const wonDeals = org.deals.filter((d) => d.status === "won");
  const lostDeals = org.deals.filter((d) => d.status === "lost");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C] mb-2">{org.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{openDeals.length} open deals</span>
            <span>•</span>
            <span>{org.people.length} people</span>
          </div>
        </div>
        <Link href="/organizations" className="text-sm text-[#3B6B8F] hover:underline">
          Back to Organizations
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              {org.address && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</div>
                  <div className="font-medium">{org.address}</div>
                </div>
              )}
              {org.websiteUrl && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Website</div>
                  <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3B6B8F] hover:underline">
                    {org.websiteUrl}
                  </a>
                </div>
              )}
              {org.linkedInProfile && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">LinkedIn</div>
                  <a href={org.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3B6B8F] hover:underline">
                    View Profile
                  </a>
                </div>
              )}
              {org.industry && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Industry</div>
                  <div className="font-medium">{org.industry}</div>
                </div>
              )}
              {org.annualRevenue && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Annual Revenue</div>
                  <div className="font-medium">{org.annualRevenue}</div>
                </div>
              )}
              {org.numberOfEmployees && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Number of Employees</div>
                  <div className="font-medium">{org.numberOfEmployees}</div>
                </div>
              )}
              {org.doors && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Doors</div>
                  <div className="font-medium">{org.doors}</div>
                </div>
              )}
              {org.labels && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Labels</div>
                  <div className="font-medium">{org.labels}</div>
                </div>
              )}
            </div>
          </div>

          {/* People */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">People ({org.people.length})</h2>
            {org.people.length > 0 ? (
              <div className="space-y-3">
                {org.people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/person/${person.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div>
                      <div className="font-medium text-[#2E2E2F]">
                        {person.firstName} {person.lastName}
                      </div>
                      {person.title && <div className="text-xs text-gray-500">{person.title}</div>}
                    </div>
                    <div className="text-xs text-gray-500">{person.email || person.phoneWork || "-"}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">No people added</div>
            )}
          </div>

          {/* Deals */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">
              Deals ({openDeals.length} open, {wonDeals.length} won, {lostDeals.length} lost)
            </h2>
            {org.deals.length > 0 ? (
              <div className="space-y-2">
                {org.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deal/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[#2E2E2F]">{deal.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{deal.stage.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#3B6B8F] text-sm">
                        {deal.currency} {deal.value.toNumber().toLocaleString()}
                      </div>
                      <div className={`text-xs mt-1 ${
                        deal.status === 'won' ? 'text-green-600' :
                        deal.status === 'lost' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {deal.status.toUpperCase()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">No deals</div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</div>
                <div className="font-medium">{new Date(org.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</div>
                <div className="font-medium">{new Date(org.updatedAt).toLocaleDateString()}</div>
              </div>
              {org.domain && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Domain</div>
                  <div className="font-medium">{org.domain}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
