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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C] mb-2">{org.name}</h1>
          {org.industry && (
            <div className="text-sm text-gray-500 mb-1">{org.industry}</div>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{openDeals.length} open deals</span>
            <span>•</span>
            <span>{org.people.length} people</span>
            {org.city && org.state && (
              <>
                <span>•</span>
                <span>{org.city}, {org.state}</span>
              </>
            )}
          </div>
        </div>
        <Link href="/organizations" className="text-sm text-[#3B6B8F] hover:underline">
          ← Back to Organizations
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-semibold text-[#3B6B8F]">{openDeals.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Open Deals</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-semibold text-green-600">{wonDeals.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Won Deals</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-semibold text-red-600">{lostDeals.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Lost Deals</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-semibold text-gray-700">{org.totalActivities || 0}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Activities</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {org.websiteUrl && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Website</div>
                  <a 
                    href={org.websiteUrl.startsWith('http') ? org.websiteUrl : `https://${org.websiteUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-[#3B6B8F] hover:underline"
                  >
                    {org.domain || org.websiteUrl}
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
            </div>
          </div>

          {/* Address Information */}
          {(org.city || org.state || org.country || org.fullAddress || org.address) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Address</h2>
              <div className="grid grid-cols-2 gap-4">
                {org.streetAddress && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Street Address</div>
                    <div className="text-sm font-medium">
                      {org.houseNumber && `${org.houseNumber} `}{org.streetAddress}
                      {org.apartmentSuite && `, ${org.apartmentSuite}`}
                    </div>
                  </div>
                )}
                {org.city && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">City</div>
                    <div className="text-sm font-medium">{org.city}</div>
                  </div>
                )}
                {org.state && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">State/County</div>
                    <div className="text-sm font-medium">{org.state}</div>
                  </div>
                )}
                {org.district && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">District</div>
                    <div className="text-sm font-medium">{org.district}</div>
                  </div>
                )}
                {org.region && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Region</div>
                    <div className="text-sm font-medium">{org.region}</div>
                  </div>
                )}
                {org.zipCode && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ZIP/Postal Code</div>
                    <div className="text-sm font-medium">{org.zipCode}</div>
                  </div>
                )}
                {org.country && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Country</div>
                    <div className="text-sm font-medium">{org.country}</div>
                  </div>
                )}
                {(org.fullAddress || org.address) && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Address</div>
                    <div className="text-sm font-medium">{org.fullAddress || org.address}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Business Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {org.industry && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Industry</div>
                  <div className="font-medium">{org.industry}</div>
                </div>
              )}
              {org.numberOfEmployees && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Number of Employees</div>
                  <div className="font-medium">{org.numberOfEmployees}</div>
                </div>
              )}
              {org.annualRevenue && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Annual Revenue</div>
                  <div className="font-medium">{org.annualRevenue}</div>
                </div>
              )}
              {org.doors && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Doors</div>
                  <div className="font-medium">{org.doors}</div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Stats */}
          {(org.totalActivities || org.emailMessagesCount || org.lastActivityDate) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Activity Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {org.totalActivities !== null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Activities</div>
                    <div className="text-lg font-semibold">{org.totalActivities}</div>
                  </div>
                )}
                {org.doneActivities !== null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Done</div>
                    <div className="text-lg font-semibold text-green-600">{org.doneActivities}</div>
                  </div>
                )}
                {org.activitiesToDo !== null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">To Do</div>
                    <div className="text-lg font-semibold text-orange-600">{org.activitiesToDo}</div>
                  </div>
                )}
                {org.emailMessagesCount !== null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Messages</div>
                    <div className="text-lg font-semibold">{org.emailMessagesCount}</div>
                  </div>
                )}
                {org.lastActivityDate && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Activity</div>
                    <div className="text-sm font-medium">{new Date(org.lastActivityDate).toLocaleDateString()}</div>
                  </div>
                )}
                {org.nextActivityDate && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Activity</div>
                    <div className="text-sm font-medium">{new Date(org.nextActivityDate).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

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
          {/* Labels */}
          {org.labels && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Labels</h2>
              <div className="flex flex-wrap gap-2">
                {org.labels.split(',').map((label, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {label.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</div>
                <div className="font-medium">{new Date(org.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</div>
                <div className="font-medium">{new Date(org.updatedAt).toLocaleString()}</div>
              </div>
              {org.domain && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Domain</div>
                  <div className="font-medium">{org.domain}</div>
                </div>
              )}
              {org.profilePicture && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Profile Picture</div>
                  <a href={org.profilePicture} target="_blank" rel="noopener noreferrer" className="text-[#3B6B8F] hover:underline text-xs">
                    View Image
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
