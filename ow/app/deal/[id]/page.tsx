import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealActions } from "@/app/components/DealActions";
import { DealContacts } from "@/app/components/DealContacts";
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
      dealContacts: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              emailWork: true,
              title: true,
              phoneMobile: true,
              phoneWork: true,
              organizationId: true,
              organization: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
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

  if (!deal) {
    return notFound();
  }

  // ============================================================
  // EMAIL MATCHING — Sprint 1 / 3.5 fix (replaces over-matching logic)
  // ------------------------------------------------------------
  // Confident matches (default visible):
  //   (a) Emails explicitly linked to this deal (GmailMessage.dealId === deal.id)
  //   (b) Emails whose Gmail-sync resolved personId is one of the deal's contacts
  //   (c) Emails whose `from` or `to` substring-matches one of the deal contacts'
  //       email addresses (with `@` anchoring on full addresses)
  //
  // Inferred matches (hidden behind a toggle, default OFF):
  //   (d) Emails whose `from` or `to` matches the deal's organization domain —
  //       BUT only when that domain is NOT a generic free-mail provider
  //       (gmail.com, yahoo.com, etc.) AND NOT already in the confident set.
  //
  // Hard exclusions:
  //   - The deal owner's own email is NEVER used as a match key (avoids pulling
  //     the entire inbox when owner email shares the deal's org domain or when
  //     a generic-domain org slipped through).
  //   - Generic free-mail domains as the org domain are dropped entirely (they
  //     never produce confident matches and never produce inferred matches).
  //
  // Removed (intentional):
  //   - The `EmailThread`-by-subject fuzzy join. `EmailThread` is keyed by
  //     `(subject, personId, syncUserId)` which produces duplicated and
  //     unrelated matches when subject collides across conversations. The
  //     Gmail sync already sets `GmailMessage.personId` directly, so route (b)
  //     captures the same intent more precisely.
  // ============================================================
  type GmailMessage = Omit<Awaited<ReturnType<typeof prisma.gmailMessage.findMany>>[number], 'embedding'>;

  const GENERIC_EMAIL_DOMAINS = new Set([
    'gmail.com', 'googlemail.com',
    'yahoo.com', 'ymail.com', 'rocketmail.com',
    'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com',
    'aol.com',
    'proton.me', 'protonmail.com',
    'gmx.com', 'gmx.net',
    'mail.com', 'fastmail.com', 'tutanota.com',
    'zoho.com', 'yandex.com', 'yandex.ru',
  ]);

  const ownerEmailLower = deal.owner.email.toLowerCase();

  // Collect candidate emails from EVERY contact on the deal (multi-stakeholder),
  // not just the primary contact. Pull from all four email fields on Person.
  // Filter null/empty, dedupe, and exclude owner's own address.
  const contactEmailSet = new Set<string>();
  const dealContactPersonIds: string[] = [];
  for (const dc of deal.dealContacts) {
    dealContactPersonIds.push(dc.person.id);
    for (const candidate of [
      dc.person.email,
      dc.person.emailWork,
    ]) {
      if (!candidate) continue;
      const lower = candidate.trim().toLowerCase();
      if (!lower || lower === ownerEmailLower) continue;
      contactEmailSet.add(lower);
    }
  }
  const contactEmailAddresses = Array.from(contactEmailSet);

  // Org domain — strip if generic, owner-shared, or empty.
  const rawDomain = deal.organization?.domain?.trim().toLowerCase() ?? null;
  const ownerDomain = ownerEmailLower.includes('@') ? ownerEmailLower.split('@')[1] : null;
  const orgDomain =
    rawDomain && !GENERIC_EMAIL_DOMAINS.has(rawDomain) && rawDomain !== ownerDomain
      ? rawDomain
      : null;

  // (a) Direct dealId link
  const directlyLinked = await prisma.gmailMessage.findMany({
    where: { dealId: deal.id },
    orderBy: { date: "desc" },
    take: 100,
    omit: { embedding: true },
  });

  // (b) personId-matched (Gmail sync already linked these contacts)
  let personIdMatched: GmailMessage[] = [];
  if (dealContactPersonIds.length > 0) {
    personIdMatched = await prisma.gmailMessage.findMany({
      where: { personId: { in: dealContactPersonIds } },
      orderBy: { date: "desc" },
      take: 100,
      omit: { embedding: true },
    });
  }

  // (c) Address-matched against deal-contact emails (catches emails sync didn't
  // pre-link, e.g. when the contact was created after the email arrived).
  let contactAddressMatched: GmailMessage[] = [];
  if (contactEmailAddresses.length > 0) {
    contactAddressMatched = await prisma.gmailMessage.findMany({
      where: {
        OR: contactEmailAddresses.flatMap((addr) => [
          { from: { contains: addr, mode: 'insensitive' as const } },
          { to: { contains: addr, mode: 'insensitive' as const } },
        ]),
      },
      orderBy: { date: "desc" },
      take: 100,
      omit: { embedding: true },
    });
  }

  // (d) Inferred — org-domain match, only when domain is non-generic & non-owner.
  let orgDomainMatched: GmailMessage[] = [];
  if (orgDomain) {
    orgDomainMatched = await prisma.gmailMessage.findMany({
      where: {
        OR: [
          { from: { contains: `@${orgDomain}`, mode: 'insensitive' as const } },
          { to: { contains: `@${orgDomain}`, mode: 'insensitive' as const } },
        ],
      },
      orderBy: { date: "desc" },
      take: 100,
      omit: { embedding: true },
    });
  }

  // Belt-and-suspenders: exclude any candidate whose only address signal is the
  // owner's email. This catches edge cases where the owner emailed themselves or
  // the deal contact's row has the owner's address (data hygiene gap).
  const looksLikeOwnerOnlyEmail = (e: GmailMessage): boolean => {
    const fromHasOwner = e.from?.toLowerCase().includes(ownerEmailLower) ?? false;
    const toHasOwner = e.to?.toLowerCase().includes(ownerEmailLower) ?? false;
    const fromHasContact = contactEmailAddresses.some(addr => e.from?.toLowerCase().includes(addr));
    const toHasContact = contactEmailAddresses.some(addr => e.to?.toLowerCase().includes(addr));
    return (fromHasOwner || toHasOwner) && !fromHasContact && !toHasContact;
  };

  // Dedup, partition into confident vs inferred, sort by date desc.
  const confidentIds = new Set<string>();
  const confidentEmails: GmailMessage[] = [];
  for (const email of [...directlyLinked, ...personIdMatched, ...contactAddressMatched]) {
    if (confidentIds.has(email.id)) continue;
    confidentIds.add(email.id);
    confidentEmails.push(email);
  }
  confidentEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const inferredEmails: GmailMessage[] = [];
  for (const email of orgDomainMatched) {
    if (confidentIds.has(email.id)) continue;
    if (looksLikeOwnerOnlyEmail(email)) continue;
    inferredEmails.push(email);
  }
  inferredEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Cap each list at 100 for render performance.
  const confidentEmailsCapped = confidentEmails.slice(0, 100);
  const inferredEmailsCapped = inferredEmails.slice(0, 100);

  // Legacy field kept for any code that reads `dealWithEmails.gmailMessages`.
  const gmailMessages = confidentEmailsCapped;

  const dealWithEmails = {
    ...deal,
    gmailMessages,
  };

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
    ...dealWithEmails,
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
    gmailMessages: gmailMessages.map((e) => ({
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
    dealContacts: deal.dealContacts.map((dc) => ({
      ...dc,
      createdAt: dc.createdAt.toISOString(),
      updatedAt: dc.updatedAt.toISOString(),
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
          {/* Organization */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">Organization</h2>
            {deal.organization ? (
              <Link 
                href={`/organization/${deal.organization.id}`}
                className="text-sm font-medium text-[#3B6B8F] hover:underline"
              >
                {deal.organization.name}
              </Link>
            ) : (
              <div className="text-sm text-gray-400">No organization linked</div>
            )}
          </div>

          {/* Deal Stakeholders (multi-contact) */}
          <DealContacts
            dealId={deal.id}
            dealContacts={serializedDeal.dealContacts}
            allPeople={people}
          />

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

