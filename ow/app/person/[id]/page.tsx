import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PersonDetailPage({ params }: { params: { id: string } }) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      deals: {
        include: {
          stage: true,
          pipeline: true,
        },
        orderBy: { updateTime: "desc" },
      },
    },
  });

  if (!person) {
    return notFound();
  }

  const openDeals = person.deals.filter((d) => d.status === "open");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C] mb-2">
            {person.firstName} {person.lastName}
          </h1>
          {person.title && (
            <div className="text-sm text-gray-500">{person.title}</div>
          )}
        </div>
        <Link href="/contacts" className="text-sm text-[#3B6B8F] hover:underline">
          Back to Contacts
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {person.emailWork && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email (Work)</div>
                  <a href={`mailto:${person.emailWork}`} className="text-sm text-[#3B6B8F] hover:underline">
                    {person.emailWork}
                  </a>
                </div>
              )}
              {person.emailHome && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email (Home)</div>
                  <a href={`mailto:${person.emailHome}`} className="text-sm text-[#3B6B8F] hover:underline">
                    {person.emailHome}
                  </a>
                </div>
              )}
              {person.emailOther && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email (Other)</div>
                  <a href={`mailto:${person.emailOther}`} className="text-sm text-[#3B6B8F] hover:underline">
                    {person.emailOther}
                  </a>
                </div>
              )}
              {person.phoneWork && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone (Work)</div>
                  <a href={`tel:${person.phoneWork}`} className="text-sm text-[#3B6B8F] hover:underline">
                    {person.phoneWork}
                  </a>
                </div>
              )}
              {person.phoneMobile && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone (Mobile)</div>
                  <a href={`tel:${person.phoneMobile}`} className="text-sm text-[#3B6B8F] hover:underline">
                    {person.phoneMobile}
                  </a>
                </div>
              )}
              {person.phoneHome && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone (Home)</div>
                  <a href={`tel:${person.phoneHome}`} className="text-sm text-[#3B6B8F] hover:underline">
                    {person.phoneHome}
                  </a>
                </div>
              )}
              {person.phoneOther && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone (Other)</div>
                  <a href={`tel:${person.phoneOther}`} className="text-sm text-[#3B6B8F] hover:underline">
                    {person.phoneOther}
                  </a>
                </div>
              )}
              {person.postalAddress && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</div>
                  <div className="text-sm font-medium">{person.postalAddress}</div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Professional Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {person.contactType && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contact Type</div>
                  <div className="font-medium">{person.contactType}</div>
                </div>
              )}
              {person.classification && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Classification</div>
                  <div className="font-medium">{person.classification}</div>
                </div>
              )}
              {person.qwilrProposal && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Qwilr Proposal</div>
                  <div className="text-sm font-medium">{person.qwilrProposal}</div>
                </div>
              )}
              {person.linkedInProfile && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">LinkedIn Profile</div>
                  <a href={person.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3B6B8F] hover:underline">
                    {person.linkedInProfile}
                  </a>
                </div>
              )}
              {person.instantMessenger && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Instant Messenger</div>
                  <div className="text-sm font-medium">{person.instantMessenger}</div>
                </div>
              )}
              {person.birthday && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Birthday</div>
                  <div className="text-sm font-medium">{new Date(person.birthday).toLocaleDateString()}</div>
                </div>
              )}
              {person.marketingStatus && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Marketing Status</div>
                  <div className="text-sm font-medium">{person.marketingStatus}</div>
                </div>
              )}
              {person.doubleOptIn && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Double Opt-In</div>
                  <div className="text-sm font-medium">{person.doubleOptIn}</div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {person.notes && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Notes</h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{person.notes}</div>
            </div>
          )}

          {/* Deals */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Deals ({person.deals.length})</h2>
            {person.deals.length > 0 ? (
              <div className="space-y-2">
                {person.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deal/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[#2E2E2F]">{deal.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {deal.pipeline.name} • {deal.stage.name}
                      </div>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organization */}
          {person.organization && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Organization</h2>
              <Link
                href={`/organization/${person.organization.id}`}
                className="text-[#3B6B8F] hover:underline font-medium"
              >
                {person.organization.name}
              </Link>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</div>
                <div className="font-medium">{new Date(person.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</div>
                <div className="font-medium">{new Date(person.updatedAt).toLocaleString()}</div>
              </div>
              {person.labels && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Labels</div>
                  <div className="text-sm">{person.labels}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
