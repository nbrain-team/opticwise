import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonActions } from "@/app/components/PersonActions";
import { DetailTabs } from "@/app/components/DetailTabs";
import { NotesTab } from "@/app/components/NotesTab";
import { EmailsTab } from "@/app/components/EmailsTab";
import { FilesTab } from "@/app/components/FilesTab";
import { ActivitiesTab } from "@/app/components/ActivitiesTab";

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      organization: true,
      deals: {
        include: {
          stage: true,
          pipeline: true,
        },
        orderBy: { updateTime: "desc" },
      },
      noteRecords: {
        orderBy: { createdAt: "desc" },
      },
      driveFiles: {
        orderBy: { modifiedTime: "desc" },
        take: 50,
      },
      activities: {
        orderBy: [
          { status: "asc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
      },
    },
  });

  if (!person) {
    return notFound();
  }

  // Fetch emails based on person's email address
  const gmailMessages = person.email 
    ? await prisma.gmailMessage.findMany({
        where: {
          OR: [
            { from: { contains: person.email, mode: 'insensitive' as const } },
            { to: { contains: person.email, mode: 'insensitive' as const } },
            { cc: { contains: person.email, mode: 'insensitive' as const } },
          ],
        },
        orderBy: { date: "desc" },
        take: 50,
      })
    : [];
  
  // Attach to person object with proper typing
  const personWithEmails = {
    ...person,
    gmailMessages,
  };

  // Get all organizations for the edit dropdown
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const openDeals = person.deals.filter((d) => d.status === "open");
  const wonDeals = person.deals.filter((d) => d.status === "won");
  const lostDeals = person.deals.filter((d) => d.status === "lost");

  // Serialize for client component
  const serializedPerson = {
    ...personWithEmails,
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
      stageChangeTime: deal.stageChangeTime.toISOString(),
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
    notes: person.noteRecords.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    gmailMessages: gmailMessages.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    driveFiles: person.driveFiles.map((f) => ({
      ...f,
      size: f.size?.toString() || null,
      createdTime: f.createdTime?.toISOString() || null,
      modifiedTime: f.modifiedTime?.toISOString() || null,
      viewedTime: f.viewedTime?.toISOString() || null,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
    activities: person.activities.map((a) => ({
      ...a,
      dueDate: a.dueDate?.toISOString() || null,
      doneTime: a.doneTime?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-light text-[#50555C] mb-2">
            {person.firstName} {person.lastName}
          </h1>
          {person.title && (
            <div className="text-sm text-gray-500">{person.title}</div>
          )}
          {person.organization && (
            <Link
              href={`/organization/${person.organization.id}`}
              className="text-sm text-[#3B6B8F] hover:underline"
            >
              {person.organization.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <PersonActions person={serializedPerson} organizations={organizations} />
          <Link href="/contacts" className="text-sm text-[#3B6B8F] hover:underline">
            ← Back to Contacts
          </Link>
        </div>
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
          <div className="text-2xl font-semibold text-gray-700">{person.totalActivities || 0}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Activities</div>
        </div>
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
              {person.linkedInProfile && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">LinkedIn</div>
                  <a href={person.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3B6B8F] hover:underline">
                    View Profile
                  </a>
                </div>
              )}
              {person.instantMessenger && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Instant Messenger</div>
                  <div className="text-sm font-medium">{person.instantMessenger}</div>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          {(person.city || person.state || person.country || person.postalAddress) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Address</h2>
              <div className="grid grid-cols-2 gap-4">
                {person.streetAddress && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Street Address</div>
                    <div className="text-sm font-medium">
                      {person.houseNumber && `${person.houseNumber} `}{person.streetAddress}
                      {person.apartmentSuite && `, ${person.apartmentSuite}`}
                    </div>
                  </div>
                )}
                {person.city && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">City</div>
                    <div className="text-sm font-medium">{person.city}</div>
                  </div>
                )}
                {person.state && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">State/County</div>
                    <div className="text-sm font-medium">{person.state}</div>
                  </div>
                )}
                {person.region && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Region</div>
                    <div className="text-sm font-medium">{person.region}</div>
                  </div>
                )}
                {person.zipCode && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ZIP/Postal Code</div>
                    <div className="text-sm font-medium">{person.zipCode}</div>
                  </div>
                )}
                {person.country && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Country</div>
                    <div className="text-sm font-medium">{person.country}</div>
                  </div>
                )}
                {person.postalAddress && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Address</div>
                    <div className="text-sm font-medium">{person.postalAddress}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Professional Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {person.title && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Job Title</div>
                  <div className="font-medium">{person.title}</div>
                </div>
              )}
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

          {/* Activity Stats */}
          {(person.totalActivities || person.emailMessagesCount || person.lastActivityDate) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Activity Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {person.totalActivities !== null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Activities</div>
                    <div className="text-lg font-semibold">{person.totalActivities}</div>
                  </div>
                )}
                {person.doneActivities !== null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Done</div>
                    <div className="text-lg font-semibold text-green-600">{person.doneActivities}</div>
                  </div>
                )}
                {person.activitiesToDo !== null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">To Do</div>
                    <div className="text-lg font-semibold text-orange-600">{person.activitiesToDo}</div>
                  </div>
                )}
                {person.emailMessagesCount !== null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Messages</div>
                    <div className="text-lg font-semibold">{person.emailMessagesCount}</div>
                  </div>
                )}
                {person.lastActivityDate && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Activity</div>
                    <div className="text-sm font-medium">{new Date(person.lastActivityDate).toLocaleDateString()}</div>
                  </div>
                )}
                {person.nextActivityDate && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Activity</div>
                    <div className="text-sm font-medium">{new Date(person.nextActivityDate).toLocaleDateString()}</div>
                  </div>
                )}
                {person.lastEmailReceived && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Email Received</div>
                    <div className="text-sm font-medium">{new Date(person.lastEmailReceived).toLocaleDateString()}</div>
                  </div>
                )}
                {person.lastEmailSent && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Email Sent</div>
                    <div className="text-sm font-medium">{new Date(person.lastEmailSent).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Labels */}
          {person.labels && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Labels</h2>
              <div className="flex flex-wrap gap-2">
                {person.labels.split(',').map((label, idx) => (
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
                <div className="font-medium">{new Date(person.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</div>
                <div className="font-medium">{new Date(person.updatedAt).toLocaleString()}</div>
              </div>
              {person.profilePicture && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Profile Picture</div>
                  <a href={person.profilePicture} target="_blank" rel="noopener noreferrer" className="text-[#3B6B8F] hover:underline text-xs">
                    View Image
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-6">
        <DetailTabs
          entityType="person"
          entityId={person.id}
          notesContent={
            <NotesTab
              entityType="person"
              entityId={person.id}
              notes={serializedPerson.notes}
            />
          }
          emailsContent={
            <EmailsTab
              entityType="person"
              entityId={person.id}
              emails={serializedPerson.gmailMessages}
            />
          }
          filesContent={
            <FilesTab
              entityType="person"
              entityId={person.id}
              files={serializedPerson.driveFiles}
            />
          }
          activitiesContent={
            <ActivitiesTab
              entityType="person"
              entityId={person.id}
              activities={serializedPerson.activities}
            />
          }
        />
      </div>
    </div>
  );
}
