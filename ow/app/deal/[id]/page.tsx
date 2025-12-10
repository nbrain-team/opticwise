import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealActions } from "@/app/components/DealActions";
import { DetailTabs } from "@/app/components/DetailTabs";
import { NotesTab } from "@/app/components/NotesTab";
import { EmailsTab } from "@/app/components/EmailsTab";
import { FilesTab } from "@/app/components/FilesTab";
import { ActivitiesTab } from "@/app/components/ActivitiesTab";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      pipeline: true,
      stage: true,
      organization: true,
      person: true,
      owner: true,
      noteRecords: {
        orderBy: { createdAt: "desc" },
      },
      gmailMessages: {
        orderBy: { date: "desc" },
        take: 50,
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

  if (!deal) {
    return notFound();
  }

  // Get data for edit dropdowns
  const [stages, organizations, people] = await Promise.all([
    prisma.stage.findMany({
      where: { pipelineId: deal.pipelineId },
      select: { id: true, name: true },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.person.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  // Serialize for client component
  const serializedDeal = {
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
    notes: deal.noteRecords.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    gmailMessages: deal.gmailMessages.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    driveFiles: deal.driveFiles.map((f) => ({
      ...f,
      size: f.size?.toString() || null,
      createdTime: f.createdTime?.toISOString() || null,
      modifiedTime: f.modifiedTime?.toISOString() || null,
      viewedTime: f.viewedTime?.toISOString() || null,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
    activities: deal.activities.map((a) => ({
      ...a,
      dueDate: a.dueDate?.toISOString() || null,
      doneTime: a.doneTime?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-light text-[#50555C] mb-2">{deal.title}</h1>
          <div className="text-sm text-gray-500">
            {deal.pipeline.name} • {deal.stage.name}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DealActions 
            deal={serializedDeal} 
            stages={stages}
            organizations={organizations}
            people={people}
          />
          <Link href="/deals" className="text-sm text-[#3B6B8F] hover:underline">
            Back to Deals
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Value</div>
                <div className="font-semibold text-[#3B6B8F]">
                  {deal.currency} {deal.value.toNumber().toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Probability</div>
                <div className="font-medium">{deal.probability ? `${deal.probability}%` : "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expected Close Date</div>
                <div className="font-medium">
                  {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Owner</div>
                <div className="font-medium">{deal.owner.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</div>
                <div className="font-medium capitalize">{deal.status}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Label</div>
                <div className="font-medium">{deal.label || deal.labels || "-"}</div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Property Type</div>
                <div className="font-medium">{deal.propertyType || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</div>
                <div className="font-medium">{deal.qty || "-"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Property Address</div>
                <div className="font-medium">{deal.propertyAddress || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Go-Live Target</div>
                <div className="font-medium">{deal.goLiveTarget || "-"}</div>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Financial Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ARR Forecast</div>
                <div className="font-semibold text-[#3B6B8F]">
                  {deal.arrForecast ? `${deal.arrForecastCurrency || 'USD'} ${deal.arrForecast.toNumber().toLocaleString()}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">CapEx ROM</div>
                <div className="font-semibold text-[#3B6B8F]">
                  {deal.capexRom ? `${deal.capexRomCurrency || 'USD'} ${deal.capexRom.toNumber().toLocaleString()}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">MRR</div>
                <div className="font-medium">
                  {deal.mrr ? `${deal.mrrCurrency || 'USD'} ${deal.mrr.toNumber().toLocaleString()}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ARR</div>
                <div className="font-medium">
                  {deal.arr ? `${deal.arrCurrency || 'USD'} ${deal.arr.toNumber().toLocaleString()}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ACV</div>
                <div className="font-medium">
                  {deal.acv ? `${deal.acvCurrency || 'USD'} ${deal.acv.toNumber().toLocaleString()}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Audit Value</div>
                <div className="font-medium">
                  {deal.auditValue ? `${deal.auditValueCurrency || 'USD'} ${deal.auditValue.toNumber().toLocaleString()}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ARR Expansion Potential</div>
                <div className="font-medium">
                  {deal.arrExpansionPotential ? `${deal.arrExpansionCurrency || 'USD'} ${deal.arrExpansionPotential.toNumber().toLocaleString()}` : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Documents & Links */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Documents & Resources</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prints/Plans External Link</div>
                {deal.printsPlansExternal ? (
                  <a href={deal.printsPlansExternal} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3B6B8F] hover:underline">
                    {deal.printsPlansExternal}
                  </a>
                ) : <div className="text-sm">-</div>}
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prints/Plans Dropbox Link</div>
                {deal.printsPlansDropbox ? (
                  <a href={deal.printsPlansDropbox} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3B6B8F] hover:underline">
                    {deal.printsPlansDropbox}
                  </a>
                ) : <div className="text-sm">-</div>}
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ROI/NOI/BOM Sheet</div>
                <div className="text-sm font-medium">{deal.roiNoiBomSheet || "-"}</div>
              </div>
            </div>
          </div>

          {/* Sales Details */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Sales & Qualification</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lead Source</div>
                <div className="font-medium">{deal.leadSource || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lead Source PPP</div>
                <div className="font-medium">{deal.leadSourcePPP || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Source Channel</div>
                <div className="font-medium">{deal.sourceChannel || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Source Channel ID</div>
                <div className="font-medium">{deal.sourceChannelId || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Source Origin</div>
                <div className="font-medium">{deal.sourceOrigin || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Technical POC</div>
                <div className="font-medium">{deal.technicalPOC || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ICP Segment</div>
                <div className="font-medium">{deal.icpSegment || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Readiness Score</div>
                <div className="font-medium">{deal.readinessScore || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">DDI Audit Status</div>
                <div className="font-medium">{deal.ddiAuditStatus || "-"}</div>
              </div>
            </div>
          </div>

          {/* Activity & Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Activity & Timeline</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Activities</div>
                <div className="font-medium">{deal.totalActivities || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Done / To Do</div>
                <div className="font-medium">{deal.doneActivities || 0} / {deal.activitiesToDo || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Activity</div>
                <div className="font-medium">
                  {deal.nextActivityDate ? new Date(deal.nextActivityDate).toLocaleDateString() : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Activity</div>
                <div className="font-medium">
                  {deal.lastActivityDate ? new Date(deal.lastActivityDate).toLocaleDateString() : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</div>
                <div className="font-medium">{new Date(deal.addTime).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</div>
                <div className="font-medium">{new Date(deal.updateTime).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Messages</div>
                <div className="font-medium">{deal.emailMessagesCount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Email</div>
                <div className="font-medium">
                  {deal.lastEmailReceived ? new Date(deal.lastEmailReceived).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Linked Entities */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Linked</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Organization</div>
                {deal.organization ? (
                  <Link 
                    href={`/organization/${deal.organization.id}`}
                    className="text-sm font-medium text-[#3B6B8F] hover:underline"
                  >
                    {deal.organization.name}
                  </Link>
                ) : (
                  <div className="text-sm text-gray-400">No organization</div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Person</div>
                {deal.person ? (
                  <Link 
                    href={`/person/${deal.person.id}`}
                    className="text-sm font-medium text-[#3B6B8F] hover:underline"
                  >
                    {deal.person.firstName} {deal.person.lastName}
                  </Link>
                ) : (
                  <div className="text-sm text-gray-400">No contact person</div>
                )}
              </div>
            </div>
          </div>

          {/* Products */}
          {(deal.productName || deal.productQuantity) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Products</h2>
              <div className="space-y-3">
                {deal.productName && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Product Name</div>
                    <div className="font-medium">{deal.productName}</div>
                  </div>
                )}
                {deal.productQuantity && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</div>
                    <div className="font-medium">{deal.productQuantity}</div>
                  </div>
                )}
                {deal.productAmount && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</div>
                    <div className="font-semibold text-[#3B6B8F]">
                      {deal.currency} {deal.productAmount.toNumber().toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status History */}
          {(deal.wonTime || deal.lostTime) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Status History</h2>
              <div className="space-y-3">
                {deal.wonTime && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Won Time</div>
                    <div className="text-sm font-medium text-green-600">
                      {new Date(deal.wonTime).toLocaleString()}
                    </div>
                  </div>
                )}
                {deal.lostTime && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lost Time</div>
                    <div className="text-sm font-medium text-red-600">
                      {new Date(deal.lostTime).toLocaleString()}
                    </div>
                  </div>
                )}
                {deal.lostReason && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lost Reason</div>
                    <div className="text-sm">{deal.lostReason}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-6">
        <DetailTabs
          entityType="deal"
          entityId={deal.id}
          notesContent={
            <NotesTab
              entityType="deal"
              entityId={deal.id}
              notes={serializedDeal.notes}
            />
          }
          emailsContent={
            <EmailsTab
              entityType="deal"
              entityId={deal.id}
              emails={serializedDeal.gmailMessages}
            />
          }
          filesContent={
            <FilesTab
              entityType="deal"
              entityId={deal.id}
              files={serializedDeal.driveFiles}
            />
          }
          activitiesContent={
            <ActivitiesTab
              entityType="deal"
              entityId={deal.id}
              activities={serializedDeal.activities}
            />
          }
        />
      </div>
    </div>
  );
}

