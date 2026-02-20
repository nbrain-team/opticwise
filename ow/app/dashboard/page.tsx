import { prisma } from "@/lib/db";
import Link from "next/link";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    pipeline,
    dealCounts,
    totalContacts,
    totalOrganizations,
    recentActivities,
    closingSoonDeals,
    recentDeals,
    wonDealsThisMonth,
    emailsThisWeek,
  ] = await Promise.all([
    prisma.pipeline.findFirst({
      where: { name: "Sales Pipeline" },
      include: {
        stages: {
          orderBy: { orderIndex: "asc" },
          include: {
            deals: {
              where: { status: "open" },
              select: { id: true, value: true, currency: true },
            },
          },
        },
      },
    }),
    prisma.deal.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { value: true },
    }),
    prisma.person.count(),
    prisma.organization.count(),
    prisma.activity.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        deal: { select: { id: true, title: true } },
        person: { select: { id: true, firstName: true, lastName: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.deal.findMany({
      where: {
        status: "open",
        expectedCloseDate: { gte: now, lte: thirtyDaysFromNow },
      },
      orderBy: { expectedCloseDate: "asc" },
      take: 8,
      include: {
        stage: { select: { name: true } },
        organization: { select: { id: true, name: true } },
        person: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.deal.findMany({
      where: { status: "open" },
      orderBy: { addTime: "desc" },
      take: 5,
      include: {
        stage: { select: { name: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.deal.findMany({
      where: {
        status: "won",
        wonTime: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
      select: { value: true, currency: true },
    }),
    prisma.gmailMessage.count({
      where: { date: { gte: sevenDaysAgo } },
    }),
  ]);

  const openCount = dealCounts.find(d => d.status === "open");
  const wonCount = dealCounts.find(d => d.status === "won");
  const lostCount = dealCounts.find(d => d.status === "lost");

  const openDealCount = openCount?._count.id || 0;
  const wonDealCount = wonCount?._count.id || 0;
  const lostDealCount = lostCount?._count.id || 0;

  const totalPipelineValue = pipeline?.stages.reduce((sum, stage) => {
    return sum + stage.deals.reduce((s, d) => s + Number(d.value), 0);
  }, 0) || 0;

  const wonRevenue = wonDealsThisMonth.reduce((sum, d) => sum + Number(d.value), 0);

  const winRate = wonDealCount + lostDealCount > 0
    ? Math.round((wonDealCount / (wonDealCount + lostDealCount)) * 100)
    : 0;

  const activityTypeIcons: Record<string, string> = {
    email: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    call: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    meeting: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    task: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    deadline: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    lunch: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C]">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">CRM overview and pipeline metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/deals"
            className="text-sm border border-gray-300 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition-colors"
          >
            View Pipeline
          </Link>
          <Link
            href="/sales-inbox"
            className="text-sm border border-[#3B6B8F] text-[#3B6B8F] rounded-lg px-4 py-2 bg-white hover:bg-blue-50 transition-colors"
          >
            Sales Inbox
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pipeline Value</div>
          <div className="text-2xl font-semibold text-[#3B6B8F]">
            ${totalPipelineValue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">{openDealCount} open deals</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Won This Month</div>
          <div className="text-2xl font-semibold text-green-600">
            ${wonRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">{wonDealsThisMonth.length} deals won</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Win Rate</div>
          <div className="text-2xl font-semibold text-[#50555C]">{winRate}%</div>
          <div className="text-xs text-gray-400 mt-1">{wonDealCount}W / {lostDealCount}L</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Contacts</div>
          <div className="text-2xl font-semibold text-[#50555C]">{totalContacts.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">{totalOrganizations} organizations</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Emails (7d)</div>
          <div className="text-2xl font-semibold text-[#50555C]">{emailsThisWeek.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">synced this week</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Closing Soon</div>
          <div className="text-2xl font-semibold text-orange-600">{closingSoonDeals.length}</div>
          <div className="text-xs text-gray-400 mt-1">next 30 days</div>
        </div>
      </div>

      {/* Pipeline Stage Breakdown */}
      {pipeline && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2E2E2F] mb-5">Pipeline Stages</h2>
          <div className="space-y-3">
            {pipeline.stages.map((stage) => {
              const stageValue = stage.deals.reduce((s, d) => s + Number(d.value), 0);
              const maxValue = Math.max(
                ...pipeline.stages.map(st =>
                  st.deals.reduce((s, d) => s + Number(d.value), 0)
                ),
                1
              );
              const barWidth = Math.max((stageValue / maxValue) * 100, 2);

              return (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className="w-48 text-sm text-gray-700 font-medium truncate" title={stage.name}>
                    {stage.name}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="bg-[#3B6B8F] h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${barWidth}%`, minWidth: stage.deals.length > 0 ? '60px' : '0' }}
                    >
                      {stage.deals.length > 0 && (
                        <span className="text-xs text-white font-medium whitespace-nowrap">
                          ${stageValue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-semibold text-[#3B6B8F]">{stage.deals.length}</span>
                    <span className="text-xs text-gray-400 ml-1">deals</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals Closing Soon */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2E2E2F]">Closing Soon</h2>
            <span className="text-xs text-gray-400">Next 30 days</span>
          </div>
          {closingSoonDeals.length > 0 ? (
            <div className="space-y-2">
              {closingSoonDeals.map((deal) => {
                const daysLeft = deal.expectedCloseDate
                  ? Math.ceil((deal.expectedCloseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                const isUrgent = daysLeft <= 7;

                return (
                  <Link
                    key={deal.id}
                    href={`/deal/${deal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#2E2E2F] text-sm truncate">{deal.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {deal.organization?.name || "No org"} &middot; {deal.stage.name}
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="font-semibold text-[#3B6B8F] text-sm">
                        {deal.currency} {Number(deal.value).toLocaleString()}
                      </div>
                      <div className={`text-xs mt-0.5 ${isUrgent ? 'text-red-600 font-semibold' : 'text-orange-500'}`}>
                        {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-6 text-center">No deals closing in the next 30 days</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2E2E2F]">Recent Activity</h2>
            <span className="text-xs text-gray-400">Last 7 days</span>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-2">
              {recentActivities.map((activity) => {
                const iconPath = activityTypeIcons[activity.type] || activityTypeIcons.task;
                const linkedEntity = activity.deal
                  ? { label: activity.deal.title, href: `/deal/${activity.deal.id}` }
                  : activity.person
                  ? { label: `${activity.person.firstName} ${activity.person.lastName}`, href: `/person/${activity.person.id}` }
                  : activity.organization
                  ? { label: activity.organization.name, href: `/organization/${activity.organization.id}` }
                  : null;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100"
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.status === 'done' ? 'bg-green-50' : 'bg-orange-50'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        activity.status === 'done' ? 'text-green-600' : 'text-orange-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#2E2E2F] truncate">{activity.subject}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 capitalize">{activity.type}</span>
                        {linkedEntity && (
                          <>
                            <span className="text-xs text-gray-300">&middot;</span>
                            <Link href={linkedEntity.href} className="text-xs text-[#3B6B8F] hover:underline truncate">
                              {linkedEntity.label}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {formatRelativeDate(activity.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-6 text-center">No recent activity</div>
          )}
        </div>
      </div>

      {/* Recently Added Deals */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2E2E2F]">Recently Added Deals</h2>
          <Link href="/deals" className="text-sm text-[#3B6B8F] hover:underline">
            View all
          </Link>
        </div>
        {recentDeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {recentDeals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deal/${deal.id}`}
                className="p-4 rounded-lg border border-gray-100 hover:border-[#3B6B8F] hover:shadow-sm transition-all"
              >
                <div className="font-medium text-[#2E2E2F] text-sm truncate">{deal.title}</div>
                <div className="text-xs text-gray-500 mt-1 truncate">{deal.organization?.name || "No org"}</div>
                <div className="font-semibold text-[#3B6B8F] text-sm mt-2">
                  {deal.currency} {Number(deal.value).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">{deal.stage.name}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400 py-4 text-center">No deals yet</div>
        )}
      </div>
    </div>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
