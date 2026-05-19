import { prisma } from "@/lib/db";
import Link from "next/link";
import { BackfillCategoriesButton } from "@/app/components/BackfillCategoriesButton";

export default async function MeetingTranscriptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = (params.search as string) || "";
  const status = (params.status as string) || "all";
  const page = parseInt((params.page as string) || "1");
  const perPage = 25;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "assigned") {
    where.OR = [
      { dealId: { not: null } },
      { personId: { not: null } },
      { organizationId: { not: null } },
    ];
  } else if (status === "unassigned") {
    where.dealId = null;
    where.personId = null;
    where.organizationId = null;
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [meetings, totalCount, assignedCount, unassignedCount, thisWeekCount, uncategorizedCount] =
    await Promise.all([
      prisma.readAIMeeting.findMany({
        where,
        include: {
          deal: { select: { id: true, title: true } },
          person: {
            select: { id: true, firstName: true, lastName: true },
          },
          organization: { select: { id: true, name: true } },
        },
        orderBy: { startTime: "desc" },
        skip,
        take: perPage,
      }),
      prisma.readAIMeeting.count({ where }),
      prisma.readAIMeeting.count({
        where: {
          OR: [
            { dealId: { not: null } },
            { personId: { not: null } },
            { organizationId: { not: null } },
          ],
        },
      }),
      prisma.readAIMeeting.count({
        where: {
          dealId: null,
          personId: null,
          organizationId: null,
        },
      }),
      prisma.readAIMeeting.count({
        where: { startTime: { gte: weekAgo } },
      }),
      prisma.readAIMeeting.count({
        where: { categorizedAt: null },
      }),
    ]);

  const totalPages = Math.ceil(totalCount / perPage);
  const grandTotal = assignedCount + unassignedCount;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-light text-[#50555C]">
          Meeting Transcripts
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Automatically imported from Read AI
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#3B6B8F] rounded-lg p-4 text-white">
          <div className="text-sm font-medium opacity-90">
            Total Transcripts
          </div>
          <div className="text-3xl font-bold mt-1">{grandTotal}</div>
        </div>
        <div className="bg-emerald-500 rounded-lg p-4 text-white">
          <div className="text-sm font-medium opacity-90">
            Linked to CRM
          </div>
          <div className="text-3xl font-bold mt-1">{assignedCount}</div>
        </div>
        <div className="bg-amber-500 rounded-lg p-4 text-white">
          <div className="text-sm font-medium opacity-90">
            Needs Assignment
          </div>
          <div className="text-3xl font-bold mt-1">{unassignedCount}</div>
        </div>
        <div className="bg-[#6366f1] rounded-lg p-4 text-white">
          <div className="text-sm font-medium opacity-90">This Week</div>
          <div className="text-3xl font-bold mt-1">{thisWeekCount}</div>
        </div>
      </div>

      {/* Backfill prompt */}
      <BackfillCategoriesButton uncategorizedCount={uncategorizedCount} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form method="GET" className="flex gap-2 flex-1">
          {status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}
          <div className="flex gap-2">
            <Link
              href={`/meeting-transcripts?${search ? `search=${encodeURIComponent(search)}&` : ""}status=all`}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                status === "all"
                  ? "bg-[#3B6B8F] text-white border-[#3B6B8F]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              All
            </Link>
            <Link
              href={`/meeting-transcripts?${search ? `search=${encodeURIComponent(search)}&` : ""}status=assigned`}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                status === "assigned"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Linked
            </Link>
            <Link
              href={`/meeting-transcripts?${search ? `search=${encodeURIComponent(search)}&` : ""}status=unassigned`}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                status === "unassigned"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Unassigned
            </Link>
          </div>
          <input
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Search transcripts..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent transition-all text-sm"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
          {(search || status !== "all") && (
            <Link
              href="/meeting-transcripts"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Meeting Cards */}
      {meetings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            No transcripts yet
          </h3>
          <p className="text-sm text-gray-400">
            Meeting transcripts from Read AI will appear here automatically
            after each meeting.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => {
            const participants = (meeting.participants as Array<{ name?: string; email?: string }>) || [];
            const owner = meeting.owner as { name?: string; email?: string } | null;
            const actionItems = (meeting.actionItems as Array<{ text: string }>) || [];
            const topics = (meeting.topics as Array<{ text: string }>) || [];
            const isLinked = meeting.dealId || meeting.personId || meeting.organizationId;

            return (
              <div
                key={meeting.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link
                          href={`/meeting-transcripts/${meeting.id}`}
                          className="text-lg font-semibold text-[#2E2E2F] hover:text-[#3B6B8F] transition-colors truncate"
                        >
                          {meeting.title}
                        </Link>
                        {isLinked ? (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Linked
                          </span>
                        ) : (
                          <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Unassigned
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {new Date(meeting.startTime).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                        {meeting.platform && (
                          <span className="ml-2 text-gray-400 capitalize">
                            via {meeting.platform}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        {owner?.name && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {owner.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {participants.length} participants
                        </span>
                        {actionItems.length > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            {actionItems.length} action items
                          </span>
                        )}
                        {topics.length > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {topics.length} topics
                          </span>
                        )}
                      </div>
                      {meeting.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {meeting.summary}
                        </p>
                      )}

                      {/* Linked CRM entities */}
                      {isLinked && (
                        <div className="flex items-center gap-3 mt-3 text-xs">
                          {meeting.deal && (
                            <Link
                              href={`/deal/${meeting.deal.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#3B6B8F] rounded hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {meeting.deal.title}
                            </Link>
                          )}
                          {meeting.person && (
                            <Link
                              href={`/contact/${meeting.person.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#3B6B8F] rounded hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {meeting.person.firstName} {meeting.person.lastName}
                            </Link>
                          )}
                          {meeting.organization && (
                            <Link
                              href={`/organization/${meeting.organization.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#3B6B8F] rounded hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                              </svg>
                              {meeting.organization.name}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex gap-2">
                      <Link
                        href={`/meeting-transcripts/${meeting.id}`}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        View Details
                      </Link>
                      {meeting.reportUrl && (
                        <a
                          href={meeting.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                        >
                          Read AI Report
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} ({totalCount} transcripts)
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/meeting-transcripts?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/meeting-transcripts?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
