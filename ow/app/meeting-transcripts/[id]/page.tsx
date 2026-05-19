import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignMeeting } from "./AssignMeeting";
import { GenerateFromTranscript } from "@/app/components/GenerateFromTranscript";
import { CategoryPicker } from "@/app/components/CategoryPicker";
import { GENERATE_ACTIONS, type MeetingCategoryValue } from "@/lib/meeting-generate";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const meeting = await prisma.readAIMeeting.findUnique({
    where: { id },
    include: {
      deal: { select: { id: true, title: true } },
      person: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      organization: { select: { id: true, name: true } },
    },
  });

  if (!meeting) return notFound();

  const participants =
    (meeting.participants as Array<{
      name?: string;
      first_name?: string;
      last_name?: string;
      email?: string | null;
    }>) || [];
  const owner = meeting.owner as {
    name?: string;
    email?: string;
  } | null;
  const actionItems =
    (meeting.actionItems as Array<{ text: string }>) || [];
  const keyQuestions =
    (meeting.keyQuestions as Array<{ text: string }>) || [];
  const topics = (meeting.topics as Array<{ text: string }>) || [];
  const chapterSummaries =
    (meeting.chapterSummaries as Array<{
      title: string;
      description: string;
      topics?: Array<{ text: string }>;
    }>) || [];

  // Duration calculation
  let durationText = "";
  if (meeting.startTime && meeting.endTime) {
    const diffMs =
      new Date(meeting.endTime).getTime() -
      new Date(meeting.startTime).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins >= 60) {
      durationText = `${Math.floor(mins / 60)}h ${mins % 60}m`;
    } else {
      durationText = `${mins}m`;
    }
  }

  // Fetch deals and people for the assignment dropdown
  const [deals, people] = await Promise.all([
    prisma.deal.findMany({
      where: { status: "open" },
      select: {
        id: true,
        title: true,
        organization: { select: { name: true } },
      },
      orderBy: { updateTime: "desc" },
      take: 200,
    }),
    prisma.person.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        organizationId: true,
        organization: { select: { id: true, name: true } },
      },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const serializedMeeting = {
    id: meeting.id,
    title: meeting.title,
    dealId: meeting.dealId,
    personId: meeting.personId,
    organizationId: meeting.organizationId,
    deal: meeting.deal,
    person: meeting.person,
    organization: meeting.organization,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-light text-[#50555C] mb-2">
            {meeting.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>
              {new Date(meeting.startTime).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {durationText && <span>{durationText}</span>}
            {meeting.platform && (
              <span className="capitalize">via {meeting.platform}</span>
            )}
            {meeting.category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#3B6B8F] text-xs font-medium capitalize">
                {meeting.category.replace(/_/g, " ")}
                {typeof meeting.categoryConfidence === "number" && (
                  <span className="text-gray-400">· {Math.round(meeting.categoryConfidence * 100)}%</span>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {meeting.reportUrl && (
            <a
              href={meeting.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Open in Read AI
            </a>
          )}
          <Link
            href="/meeting-transcripts"
            className="text-sm text-[#3B6B8F] hover:underline"
          >
            Back to Transcripts
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* 4.7 — Generate from transcript */}
          {(() => {
            const cat = (meeting.category || "other") as MeetingCategoryValue;
            const actions = GENERATE_ACTIONS[cat] || GENERATE_ACTIONS.other;
            const noBody = !meeting.transcript && !meeting.summary;
            return (
              <GenerateFromTranscript
                meetingId={meeting.id}
                category={cat}
                categoryReason={meeting.categoryReason}
                categoryConfidence={meeting.categoryConfidence}
                actions={actions}
                emptyMessage={
                  noBody
                    ? "This meeting has no transcript or summary yet, so there's nothing to generate from."
                    : null
                }
              />
            );
          })()}

          {/* Summary */}
          {meeting.summary && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
                Summary
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {meeting.summary}
              </p>
            </div>
          )}

          {/* Chapter Summaries */}
          {chapterSummaries.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-4">
                Chapter Summaries
              </h2>
              <div className="space-y-4">
                {chapterSummaries.map((chapter, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-[#3B6B8F] pl-4"
                  >
                    <h3 className="font-medium text-[#2E2E2F] text-sm">
                      {chapter.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {chapter.description}
                    </p>
                    {chapter.topics && chapter.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {chapter.topics.map((t, j) => (
                          <span
                            key={j}
                            className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {t.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items & Key Questions side by side */}
          {(actionItems.length > 0 || keyQuestions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {actionItems.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
                    Action Items
                  </h2>
                  <ul className="space-y-2">
                    {actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <svg
                          className="w-4 h-4 text-[#3B6B8F] mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                        <span className="text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {keyQuestions.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
                    Key Questions
                  </h2>
                  <ul className="space-y-2">
                    {keyQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <svg
                          className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-gray-700">{q.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Full Transcript */}
          {meeting.transcript && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
                Full Transcript
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {meeting.transcript}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CRM Assignment */}
          <AssignMeeting
            meeting={serializedMeeting}
            deals={deals.map((d) => ({
              id: d.id,
              title: d.title,
              orgName: d.organization?.name || null,
            }))}
            people={people.map((p) => ({
              id: p.id,
              name: `${p.firstName} ${p.lastName}`,
              email: p.email,
              orgId: p.organizationId,
              orgName: p.organization?.name || null,
            }))}
          />

          {/* Meeting Owner */}
          {owner && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
                Meeting Owner
              </h2>
              <div className="text-sm">
                <div className="font-medium text-gray-800">{owner.name}</div>
                {owner.email && (
                  <div className="text-gray-500">{owner.email}</div>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          {participants.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
                Participants ({participants.length})
              </h2>
              <ul className="space-y-2">
                {participants.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#3B6B8F] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {(p.first_name?.[0] || p.name?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {p.name ||
                          `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
                          "Unknown"}
                      </div>
                      {p.email && (
                        <div className="text-xs text-gray-500">{p.email}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
                Topics
              </h2>
              <div className="flex flex-wrap gap-2">
                {topics.map((t, i) => (
                  <span
                    key={i}
                    className="inline-block px-3 py-1 bg-blue-50 text-[#3B6B8F] rounded-full text-xs font-medium"
                  >
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2E2F] mb-3">
              Details
            </h2>
            <div className="space-y-3 text-sm">
              {meeting.platform && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Platform
                  </div>
                  <div className="font-medium capitalize">
                    {meeting.platform}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                  Start Time
                </div>
                <div className="font-medium">
                  {new Date(meeting.startTime).toLocaleString()}
                </div>
              </div>
              {meeting.endTime && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    End Time
                  </div>
                  <div className="font-medium">
                    {new Date(meeting.endTime).toLocaleString()}
                  </div>
                </div>
              )}
              {durationText && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Duration
                  </div>
                  <div className="font-medium">{durationText}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                  Session ID
                </div>
                <div className="font-mono text-xs text-gray-500 break-all">
                  {meeting.sessionId}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
