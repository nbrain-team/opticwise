/**
 * Sprint 2 / 3.6 (ii) — Transactional contact merge.
 *
 * Takes a `keepId` and one-or-more `victimIds`, and:
 *   1. Reassigns every personId-bearing child row from victims → keeper.
 *      - DealContact has @@unique([dealId, personId]) → delete victim row when
 *        keeper is already on the same deal, otherwise reassign.
 *      - All other 14 models (Deal, EmailThread, GmailMessage, Activity,
 *        Note, CalendarEvent, DriveFile, CampaignLead, AuditRequest,
 *        BookRequest, FormSubmission, ConferenceAttendee, ChatbotConversation,
 *        ReadAIMeeting, CallTranscript) have no uniqueness on personId, so a
 *        plain UPDATE is sufficient.
 *   2. Backfills null fields on the keeper from the most-complete victim
 *      (never overwrites a non-null keeper field).
 *   3. Preserves victim primary emails by stashing them into the keeper's
 *      `emailOther` / `emailWork` / `emailHome` slots when free; otherwise
 *      records them in the merge notes so the data is not silently lost.
 *   4. Concatenates every victim's `notes` onto the keeper's, prefixed with
 *      a `[Merged from <id>]:` header.
 *   5. Deletes the victim Person rows last.
 *
 * Everything runs inside a single `prisma.$transaction` — partial merges are
 * impossible.
 *
 * Why this exists: the legacy `scripts/merge-duplicates.ts` calls deleteMany
 * on Person without reassigning child FKs, which combined with the schema's
 * `onDelete: SetNull` on every Person back-reference would orphan every
 * GmailMessage / DealContact / Activity / etc. link on victims. DO NOT use
 * that script. This function is its safe replacement.
 */

import { prisma } from "./db";
import type { Person } from "@prisma/client";

export type MergeRequest = {
  keepId: string;
  victimIds: string[];
};

export type MergeSuccess = {
  ok: true;
  keptId: string;
  mergedFromIds: string[];
  reassigned: Record<string, number>;
  fieldsBackfilled: string[];
  notes: string[];
};

export type MergeFailure = {
  ok: false;
  error: string;
};

export type MergeResult = MergeSuccess | MergeFailure;

/**
 * Completeness scoring — used to pick which victim's value to take when
 * backfilling null fields on the keeper. Higher score = more-populated record.
 */
function scoreCompleteness(p: Person): number {
  let s = 0;
  if (p.email) s += 10;
  if (p.emailWork) s += 10;
  if (p.emailHome) s += 5;
  if (p.emailOther) s += 5;
  if (p.phone) s += 8;
  if (p.phoneWork) s += 8;
  if (p.phoneMobile) s += 6;
  if (p.phoneHome) s += 3;
  if (p.phoneOther) s += 3;
  if (p.organizationId) s += 15;
  if (p.title) s += 5;
  if (p.linkedInProfile) s += 5;
  if (p.city) s += 3;
  if (p.state) s += 3;
  if (p.country) s += 2;
  if (p.zipCode) s += 2;
  if (p.postalAddress) s += 4;
  if (p.notes) s += 5;
  if (p.openDeals && p.openDeals > 0) s += 20;
  if (p.wonDeals && p.wonDeals > 0) s += 15;
  if (p.totalActivities && p.totalActivities > 0) s += 10;
  return s;
}

/**
 * Fields that should be backfilled from victims onto keeper IF keeper's value
 * is currently null. Email primary is excluded — it's @unique and handled
 * specially via the emailOther/emailWork/emailHome cascade below.
 */
const BACKFILL_FIELDS: Array<keyof Person> = [
  "emailWork",
  "emailHome",
  "emailOther",
  "phone",
  "phoneWork",
  "phoneHome",
  "phoneMobile",
  "phoneOther",
  "title",
  "labels",
  "contactType",
  "organizationId",
  "postalAddress",
  "streetAddress",
  "houseNumber",
  "apartmentSuite",
  "city",
  "state",
  "region",
  "country",
  "zipCode",
  "latitude",
  "longitude",
  "birthday",
  "linkedInProfile",
  "qwilrProposal",
  "classification",
  "instantMessenger",
  "marketingStatus",
  "doubleOptIn",
  "profilePicture",
];

/**
 * Try to stash a victim's primary `email` into one of the keeper's free
 * secondary email slots so the address isn't lost when the victim row is
 * deleted. Returns the slot used, or null if every slot is taken.
 */
function findFreeEmailSlot(
  keeperUpdate: Partial<Record<keyof Person, unknown>>,
  keeperCurrent: Person
): "emailOther" | "emailWork" | "emailHome" | null {
  const slot = (key: "emailOther" | "emailWork" | "emailHome") => {
    // A slot is free if either (a) the keeper currently has null AND we
    // haven't already filled it during backfill, or (b) the current value
    // matches what we're trying to stash (idempotent).
    const pending = keeperUpdate[key] as string | null | undefined;
    if (pending !== undefined) return pending === null;
    return keeperCurrent[key] === null;
  };

  if (slot("emailOther")) return "emailOther";
  if (slot("emailWork")) return "emailWork";
  if (slot("emailHome")) return "emailHome";
  return null;
}

export async function mergeContacts({
  keepId,
  victimIds,
}: MergeRequest): Promise<MergeResult> {
  if (!keepId || typeof keepId !== "string") {
    return { ok: false, error: "keepId is required" };
  }
  if (!Array.isArray(victimIds) || victimIds.length === 0) {
    return { ok: false, error: "victimIds must be a non-empty array" };
  }

  const uniqueVictims = Array.from(new Set(victimIds)).filter((id) => id !== keepId);
  if (uniqueVictims.length === 0) {
    return { ok: false, error: "victimIds cannot only contain keepId" };
  }

  const allIds = [keepId, ...uniqueVictims];

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Load every involved Person row up-front.
      const people = await tx.person.findMany({ where: { id: { in: allIds } } });
      if (people.length !== allIds.length) {
        const found = new Set(people.map((p) => p.id));
        const missing = allIds.filter((id) => !found.has(id));
        throw new Error(`Person not found: ${missing.join(", ")}`);
      }
      const keeper = people.find((p) => p.id === keepId)!;
      const victims = people
        .filter((p) => p.id !== keepId)
        .sort((a, b) => scoreCompleteness(b) - scoreCompleteness(a));

      const reassigned: Record<string, number> = {};
      const notes: string[] = [];

      // 2. Handle DealContact unique constraint first — delete victim rows
      //    that conflict with keeper rows on the same dealId, then reassign
      //    the rest.
      const dcDuplicatesDeleted = await tx.$executeRaw`
        DELETE FROM "DealContact"
        WHERE "personId" = ANY(${uniqueVictims}::text[])
          AND "dealId" IN (
            SELECT "dealId" FROM "DealContact" WHERE "personId" = ${keepId}
          )
      `;
      if (dcDuplicatesDeleted > 0) {
        reassigned.dealContactDuplicatesDeleted = dcDuplicatesDeleted;
      }
      const dcReassigned = await tx.dealContact.updateMany({
        where: { personId: { in: uniqueVictims } },
        data: { personId: keepId },
      });
      if (dcReassigned.count > 0) reassigned.dealContact = dcReassigned.count;

      // 3. Reassign every other child-table FK. None of these tables have a
      //    unique constraint on personId, so plain updateMany is safe.
      const targets = [
        { name: "deal", run: () => tx.deal.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "emailThread", run: () => tx.emailThread.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "callTranscript", run: () => tx.callTranscript.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "readAIMeeting", run: () => tx.readAIMeeting.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "gmailMessage", run: () => tx.gmailMessage.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "calendarEvent", run: () => tx.calendarEvent.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "driveFile", run: () => tx.driveFile.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "note", run: () => tx.note.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "activity", run: () => tx.activity.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "campaignLead", run: () => tx.campaignLead.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "auditRequest", run: () => tx.auditRequest.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "bookRequest", run: () => tx.bookRequest.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "formSubmission", run: () => tx.formSubmission.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "conferenceAttendee", run: () => tx.conferenceAttendee.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
        { name: "chatbotConversation", run: () => tx.chatbotConversation.updateMany({ where: { personId: { in: uniqueVictims } }, data: { personId: keepId } }) },
      ] as const;

      for (const target of targets) {
        const result = await target.run();
        if (result.count > 0) reassigned[target.name] = result.count;
      }

      // 4. Backfill null keeper fields from the most-complete victim.
      const keeperUpdate: Record<string, unknown> = {};
      const fieldsBackfilled: string[] = [];

      for (const field of BACKFILL_FIELDS) {
        if (keeper[field] !== null && keeper[field] !== undefined && keeper[field] !== "") {
          continue;
        }
        for (const v of victims) {
          const candidate = v[field];
          if (candidate !== null && candidate !== undefined && candidate !== "") {
            keeperUpdate[field] = candidate;
            fieldsBackfilled.push(field);
            break;
          }
        }
      }

      // 4a. Stash victim primary emails into keeper's free email slots when
      //     possible. This preserves the address even though the victim row
      //     is about to be deleted.
      for (const v of victims) {
        if (!v.email) continue;
        if (v.email.toLowerCase() === keeper.email?.toLowerCase()) continue;

        // Already stored in one of keeper's email slots?
        const allKeeperEmails = [
          keeper.email,
          (keeperUpdate.emailWork as string | null | undefined) ?? keeper.emailWork,
          (keeperUpdate.emailHome as string | null | undefined) ?? keeper.emailHome,
          (keeperUpdate.emailOther as string | null | undefined) ?? keeper.emailOther,
        ]
          .filter((e): e is string => typeof e === "string" && e.length > 0)
          .map((e) => e.toLowerCase());

        if (allKeeperEmails.includes(v.email.toLowerCase())) continue;

        const slot = findFreeEmailSlot(keeperUpdate, keeper);
        if (slot) {
          keeperUpdate[slot] = v.email;
          fieldsBackfilled.push(`${slot} (from ${v.id} primary email ${v.email})`);
        } else {
          notes.push(
            `Victim ${v.id} primary email '${v.email}' could not be preserved — all four email slots on keeper are populated.`
          );
        }
      }

      // 4b. Concatenate victim notes onto keeper.
      const victimNotes = victims
        .filter((v) => v.notes && v.notes.trim().length > 0)
        .map((v) => {
          const tag = v.email ?? v.id;
          return `[Merged from ${tag} on ${new Date().toISOString().slice(0, 10)}]:\n${v.notes!.trim()}`;
        });
      if (victimNotes.length > 0) {
        const combined = [keeper.notes?.trim(), ...victimNotes]
          .filter((s): s is string => Boolean(s && s.length > 0))
          .join("\n\n");
        keeperUpdate.notes = combined;
        fieldsBackfilled.push("notes");
      }

      // 4c. Maintain `name` field if the keeper's name is empty.
      if (!keeper.name || keeper.name.trim().length === 0) {
        const composed = [keeper.firstName, keeper.lastName].filter(Boolean).join(" ").trim();
        if (composed.length > 0) {
          keeperUpdate.name = composed;
          fieldsBackfilled.push("name");
        }
      }

      // 5. Apply backfill (single update) if anything to write.
      if (Object.keys(keeperUpdate).length > 0) {
        await tx.person.update({
          where: { id: keepId },
          data: keeperUpdate,
        });
      }

      // 6. Delete the victim Person rows last. By this point every child FK
      //    pointing at them has been moved, so deletion is safe and the
      //    `onDelete: SetNull` cascade on remaining (non-existent) links is a
      //    no-op.
      const deleted = await tx.person.deleteMany({
        where: { id: { in: uniqueVictims } },
      });
      reassigned.personRowsDeleted = deleted.count;

      return {
        ok: true,
        keptId: keepId,
        mergedFromIds: uniqueVictims,
        reassigned,
        fieldsBackfilled,
        notes,
      };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
