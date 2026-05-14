import { prisma } from "@/lib/db";
import Link from "next/link";

/**
 * Sprint 2 / 3.6 (ii) — Find Duplicates dashboard.
 *
 * Phase 1: READ-ONLY. Surfaces every group of Person rows that share the
 * same normalized (lower + trim) firstName + lastName. Each group renders
 * side-by-side with the fields that matter for triage:
 *   - id, primary email, work email, organization, deal count, email count
 *
 * Phase 2 (next sprint): adds per-row "Merge into A" buttons backed by a
 * transactional merge endpoint at /api/contacts/merge that:
 *   (a) reassigns all 16 child-table FKs (GmailMessage, DealContact, Activity,
 *       EmailThread, CalendarEvent, DriveFile, Note, CampaignLead, AuditRequest,
 *       BookRequest, ConferenceAttendee, ChatbotConversation, ReadAIMeeting,
 *       FormSubmission, Deal, CallTranscript) from merge-victims to the keeper,
 *   (b) handles unique-constraint conflicts on DealContact(dealId, personId)
 *       and EmailThread(syncUserId, threadId) by deleting the victim row
 *       when the keeper already has one,
 *   (c) backfills any null fields on the keeper from the victims (preferring
 *       the most-complete victim),
 *   (d) deletes the victim Person rows last (after FKs are clean).
 *
 * Why read-only first: data analysis revealed at least one deliberate
 * keep-separate case (Bill Douglas's `bill.douglas.co@gmail.com` personal vs
 * `bill.douglas@opticwise.com` work, the latter with 4,218 linked Gmail
 * messages). Manual triage before destructive action.
 *
 * Note: `bill.douglas.co@gmail.com` is also the existing `merge-duplicates.ts`
 * CLI script — DO NOT RUN THAT SCRIPT. It calls deleteMany on Person without
 * first reassigning child FKs, so the SetNull cascade would orphan every
 * email/deal/activity link on the victims.
 */

type DuplicatePerson = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  emailWork: string | null;
  organizationId: string | null;
  organizationName: string | null;
  createdAt: Date;
  emailsLinked: number;
  dealsLinked: number;
};

type DuplicateGroup = {
  normalizedKey: string;
  displayName: string;
  people: DuplicatePerson[];
};

async function loadDuplicateGroups(): Promise<DuplicateGroup[]> {
  // Raw SQL is the simplest way to get the grouped + counted shape we need.
  // We group by lower+trim of firstName + lastName, then return every Person
  // row in any group of size > 1, with deal + email counts.
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      emailWork: string | null;
      organizationId: string | null;
      organizationName: string | null;
      createdAt: Date;
      emailsLinked: bigint;
      dealsLinked: bigint;
      groupKey: string;
    }>
  >`
    WITH dup_groups AS (
      SELECT
        LOWER(TRIM("firstName")) AS fn,
        LOWER(TRIM("lastName")) AS ln,
        COUNT(*) AS n
      FROM "Person"
      WHERE "firstName" IS NOT NULL AND "firstName" <> ''
        AND "lastName" IS NOT NULL AND "lastName" <> ''
      GROUP BY LOWER(TRIM("firstName")), LOWER(TRIM("lastName"))
      HAVING COUNT(*) > 1
    )
    SELECT
      p.id,
      p."firstName" AS "firstName",
      p."lastName" AS "lastName",
      p.email,
      p."emailWork" AS "emailWork",
      p."organizationId" AS "organizationId",
      o.name AS "organizationName",
      p."createdAt" AS "createdAt",
      (SELECT COUNT(*) FROM "GmailMessage" gm WHERE gm."personId" = p.id) AS "emailsLinked",
      (SELECT COUNT(*) FROM "DealContact" dc WHERE dc."personId" = p.id) AS "dealsLinked",
      d.fn || '|||' || d.ln AS "groupKey"
    FROM "Person" p
    JOIN dup_groups d
      ON LOWER(TRIM(p."firstName")) = d.fn
     AND LOWER(TRIM(p."lastName")) = d.ln
    LEFT JOIN "Organization" o ON o.id = p."organizationId"
    ORDER BY d.fn, d.ln, p."createdAt"
  `;

  const groupMap = new Map<string, DuplicateGroup>();

  for (const row of rows) {
    const key = row.groupKey;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        normalizedKey: key,
        displayName: `${row.firstName} ${row.lastName}`,
        people: [],
      });
    }
    groupMap.get(key)!.people.push({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      emailWork: row.emailWork,
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      createdAt: row.createdAt,
      emailsLinked: Number(row.emailsLinked),
      dealsLinked: Number(row.dealsLinked),
    });
  }

  return Array.from(groupMap.values()).sort((a, b) => {
    // Highest-signal groups first (most linked activity = most painful to leave un-merged)
    const aActivity = a.people.reduce((sum, p) => sum + p.emailsLinked + p.dealsLinked, 0);
    const bActivity = b.people.reduce((sum, p) => sum + p.emailsLinked + p.dealsLinked, 0);
    if (aActivity !== bActivity) return bActivity - aActivity;
    return a.displayName.localeCompare(b.displayName);
  });
}

export default async function DuplicateContactsPage() {
  const groups = await loadDuplicateGroups();
  const totalDupRows = groups.reduce((sum, g) => sum + g.people.length, 0);
  const rowsToMergeAway = groups.reduce((sum, g) => sum + (g.people.length - 1), 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-[#50555C]">Find Duplicates</h1>
          <div className="text-sm text-gray-500 mt-1">
            {groups.length} duplicate {groups.length === 1 ? "group" : "groups"} found ·{" "}
            {totalDupRows} contacts involved ·{" "}
            {rowsToMergeAway} potential merge{rowsToMergeAway === 1 ? "" : "s"}
          </div>
        </div>
        <Link href="/contacts" className="text-sm text-[#3B6B8F] hover:underline">
          ← Back to Contacts
        </Link>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Phase 1 (read-only).</strong> This view surfaces every group of contacts
        sharing the same first + last name (case-insensitive). Some groups are real
        duplicates and some are deliberate keep-separates (e.g., personal vs work
        identity, parent vs child organization). Manual triage first. Merge actions
        will land in the next iteration once the transactional merge endpoint is
        verified — see {" "}
        <code className="rounded bg-amber-100 px-1">opticwise/SPRINT-1-ISSUES.md</code>
        {" "}/ Section 3.6 (ii).
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No duplicate name groups found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <DuplicateGroupCard key={group.normalizedKey} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function DuplicateGroupCard({ group }: { group: DuplicateGroup }) {
  const totalEmails = group.people.reduce((sum, p) => sum + p.emailsLinked, 0);
  const totalDeals = group.people.reduce((sum, p) => sum + p.dealsLinked, 0);

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-[#50555C]">{group.displayName}</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {group.people.length} records
          </span>
          {totalEmails > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              {totalEmails} email{totalEmails === 1 ? "" : "s"} across the group
            </span>
          )}
          {totalDeals > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              {totalDeals} deal{totalDeals === 1 ? "" : "s"} across the group
            </span>
          )}
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Open</th>
              <th className="px-4 py-2 font-medium">Primary email</th>
              <th className="px-4 py-2 font-medium">Work email</th>
              <th className="px-4 py-2 font-medium">Organization</th>
              <th className="px-4 py-2 font-medium text-right">Emails</th>
              <th className="px-4 py-2 font-medium text-right">Deals</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {group.people.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link
                    href={`/person/${p.id}`}
                    className="text-[#3B6B8F] hover:underline"
                  >
                    View →
                  </Link>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-700">
                  {p.email ?? <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-700">
                  {p.emailWork ?? <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {p.organizationName ?? <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                  {p.emailsLinked.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                  {p.dealsLinked.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {p.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
