import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  DuplicateGroupCard,
  type DuplicateGroupSerialized,
} from "./DuplicateGroupCard";

// Force dynamic rendering so router.refresh() after a merge re-runs the query
// against the live DB instead of returning a cached static result.
export const dynamic = "force-dynamic";

/**
 * Sprint 2 / 3.6 (ii) — Find Duplicates dashboard.
 *
 * Phase 1 (shipped 2026-05-13): READ-ONLY view of every Person group sharing
 * the same normalized firstName + lastName.
 *
 * Phase 2 (this commit): interactive per-row "Merge others → this" buttons
 * backed by the transactional `mergeContacts()` function in
 * `lib/contact-merge.ts`. The endpoint at `POST /api/contacts/merge`:
 *   (a) reassigns 16 child-table FKs (Deal, DealContact, EmailThread,
 *       GmailMessage, Activity, Note, CalendarEvent, DriveFile, CampaignLead,
 *       AuditRequest, BookRequest, FormSubmission, ConferenceAttendee,
 *       ChatbotConversation, ReadAIMeeting, CallTranscript) from victims to
 *       keeper inside a single `prisma.$transaction`,
 *   (b) handles the only unique-constraint conflict — `DealContact` on
 *       (dealId, personId) — by deleting the victim row when the keeper is
 *       already on the same deal,
 *   (c) stashes victim primary emails into keeper's free emailWork /
 *       emailHome / emailOther slots so the address is preserved,
 *   (d) backfills any other null fields on the keeper from the most-complete
 *       victim — never overwrites a non-null keeper field,
 *   (e) concatenates victim notes onto keeper with a `[Merged from <id>]:`
 *       header,
 *   (f) deletes the victim Person rows last (after every FK is clean).
 *
 * Bill-Douglas-style keep-separates: visible in the list but Bill simply
 * does not click their merge buttons. No allow-list mechanism in this
 * iteration — the small number of stuck groups is acceptable.
 *
 * Note: `scripts/merge-duplicates.ts` (legacy CLI) calls `deleteMany` on
 * Person without reassigning child FKs, so the `onDelete: SetNull` cascade
 * would orphan every email/deal/activity link on victims. DO NOT RUN that
 * script — this page + endpoint replaces it.
 */


async function loadDuplicateGroups(): Promise<DuplicateGroupSerialized[]> {
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

  const groupMap = new Map<string, DuplicateGroupSerialized>();

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
      organizationName: row.organizationName,
      createdAtISO: row.createdAt.toISOString(),
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
        <strong>Merge is live.</strong> Each group lists every contact sharing the
        same first + last name (case-insensitive). Click <em>Merge others → this</em>{" "}
        on whichever row you want to keep — all other rows in the group get their
        emails, deals, activities, and notes reassigned to the keeper inside a single
        transaction, then deleted. Backfills are non-destructive (only fills nulls on
        the keeper). Deliberate keep-separates (e.g., personal vs work identity, parent
        vs child organization) — just don&apos;t click their merge button.
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
