# Sprint 2 — Issues (in flight)

**Sprint goal:** CRM completeness — contacts (3.6), inline create company/contact (3.2), files on deals (3.3), call-recorder classifier + Fathom→Read.ai cleanup (4.7).

**Operating principles (from OWNET-V1-PUNCH-LIST-PLAN.md cross-cutting answers):**
- v1 is overdue → ship fastest viable path
- WD = Bill Douglas, DH = Drew Hall, DD = Danny DeMichele
- Render-only, no portability abstractions
- Fix-inline policy: adjacent broken things land in the same PR with an "incidental fix: X" note
- Lightweight PR model: single `main`, branches per Sprint item, one ✅ then self-merge

---

## Issue: Sprint 2 / 3.6 — Contact list completeness (search, duplicates, sync gap)

**Sprint:** 2
**Punch-list item:** 3.6
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 3.6
**Labels:** `sprint-2`, `crm`, `data-quality`
**Owner:** WD (Bill via me)
**Effort:** `S` for (i) + (iii) audit, `M` for (ii) merge UI

Three sub-issues, tracked together. Sprint 1 / 3.5 verification surfaced an
adjacent hygiene issue on Danny's contact card (`emailWork = ethan@nbrain.ai`)
which falls under (ii).

### 3.6 (i) — Search misses obvious matches

**Status:** ✅ **SHIPPED 2026-05-13 19:29 MDT** (commit `a289d98`).

**Verification before fix:** Searching `pahl` returned David Pahl correctly.
Searching `demi` returned both Danny Demichele duplicates. The bug as Bill
described it was **NOT reproducible** in current production data — the existing
Prisma `where` clause was already case-insensitive `contains` across `name`,
`firstName`, `lastName`, `email`, `city`, and `organization.name`.

**What changed anyway (defensive parity fix):** added `emailWork`, `emailHome`,
and `emailOther` to the page-level search OR clause so the `/contacts` page
matches the `/api/contacts` endpoint and so future contacts with non-primary
email addresses populated are findable. (`emailWork` is currently populated on
exactly 1 row in production — the Danny/Ethan record flagged for hygiene in (ii).)

**Acceptance:** Search returns expected contacts on partial-name input.
✅ Verified live on `ownet.opticwise.com/contacts?search=pahl` and `?search=demi`
pre-fix; same query post-fix verifies the wider field coverage.

### 3.6 (ii) — Duplicates that should have merged

**Status:** ✅ **PHASE 2 SHIPPED 2026-05-14 12:17 MDT.** Phase 1 dashboard
shipped 2026-05-13. Phase 2 transactional merge endpoint + UI buttons now
live at `/contacts/duplicates`. Awaiting Bill's verification merge.

**Phase 1 — Read-only duplicates dashboard at `/contacts/duplicates`:**

- [x] Surfaces every group of Person rows sharing the same normalized
  (lower + trim) `firstName + lastName` — currently **49 groups, 54
  potential merges** in production.
- [x] Each group renders side-by-side: primary email, work email,
  organization, deal count, email count, created date, "View" link to the
  Person detail page.
- [x] Groups sorted by total linked activity (most painful unmerged dups first).
- [x] Linked from the `/contacts` header as `Find Duplicates →`.
- [x] **No data modification.** Pure read-only surface for triage.

**Production data findings (informed the Phase 2 plan):**

- 0 duplicate-email groups → insert-time email-dedup is working.
- 49 duplicate-name groups → mostly real duplicates (same person, two work
  email addresses) but **at least one deliberate keep-separate case**:
  Bill Douglas's `bill.douglas.co@gmail.com` (personal, 6 emails, 2 deals)
  vs `bill.douglas@opticwise.com` (work, **4,218 linked emails**). Auto-merging
  these would conflate Bill's entire work inbox with the personal-Gmail
  self-test deals. **Manual triage is required.**

**Phase 2 — Transactional merge endpoint (shipped):**

- [x] `POST /api/contacts/merge` with body `{ keepId, victimIds[] }`,
      backed by `lib/contact-merge.ts` (`mergeContacts()`).
- [x] Within `prisma.$transaction`, reassigns all 15 child-table FKs from
      victims to keeper:
      Deal, DealContact (uniq on dealId+personId — deletes victim row when
      keeper already on deal), EmailThread, GmailMessage, CallTranscript
      (legacy Fathom, will be cleaned separately in 4.7), CalendarEvent,
      DriveFile, Note, Activity, CampaignLead, AuditRequest, BookRequest,
      ConferenceAttendee, ChatbotConversation, ReadAIMeeting,
      FormSubmission. **Only DealContact has a unique constraint on
      personId — all other 14 are plain updateMany.**
- [x] Backfills any null fields on keeper from the most-complete victim
      (completeness scored by populated-field weight). Never overwrites a
      non-null keeper field.
- [x] Preserves victim primary emails by stashing them into keeper's free
      `emailWork` / `emailHome` / `emailOther` slots so the address survives
      after the victim row is deleted.
- [x] Concatenates victim notes onto keeper with `[Merged from <id>]:`
      header.
- [x] Deletes the victim Person rows last (after every FK is clean).
- [x] UI: per-row "Merge others → this" buttons on `/contacts/duplicates`
      with an inline confirmation banner showing every victim's email,
      organization, linked email/deal counts, and the totals that will move
      to the keeper. Auto-refreshes the group list after a successful merge.
- [-] UI: per-group "These are not duplicates — never flag again" button
      and `PersonNotDuplicate` allow-list table — **deferred.** Small number
      of stuck keep-separate groups (e.g. Bill Douglas personal vs work) is
      acceptable; Bill just doesn't click their button.

**DANGER — existing CLI script:**

`scripts/merge-duplicates.ts` exists from earlier work but has a **critical
bug**: it calls `prisma.person.deleteMany` on victims WITHOUT first
reassigning child-table FKs. Combined with the schema's `onDelete: SetNull`
on Person back-references, running it would orphan every email / deal /
activity link on the victims. **Do NOT run this script.** The Phase 2
endpoint replaces it.

**3.6 hygiene side-finding (handled in Phase 2 via merge):**

- Danny Demichele record `cmm3wrcyr01y8ud153uqw4mcj` has
  `emailWork = ethan@nbrain.ai` (Ethan's email saved under Danny's contact
  card). Manual edit on Person detail page works as a stopgap, but the
  proper fix is for Bill to merge the second Danny Demichele record
  (`cmp1n122g0002ph2aobof4xqd`, the `danny test` PPP Starter Kit signup
  with `danny@nbrain.io` typo) and clear emailWork during the merge.

### 3.6 (iii) — Gmail sync gap (people I've emailed don't appear as contacts)

**Status:** ✅ **SHIPPED 2026-05-14 12:35 MDT** (forward-going). One-time
backfill of historical `personId=null` GmailMessage rows is the only
remaining piece — listed as a follow-up below.

**Audit finding (2026-05-13 19:25 MDT):**

Contact extraction was a **manual CLI script** at
`scripts/extract-contacts-from-emails.ts` that outputs a CSV. It was:
- NOT wired into the Gmail sync flow at `/api/sales-inbox/sync`
- NOT on a Render cron job
- NOT auto-creating Person rows (only outputs CSV that Danny used to
  bulk-import historically)

So Bill's "I emailed these people but they don't show up in Contacts" was
expected — the system only created Person rows when (a) someone clicked
"+ New Contact" in the UI, (b) Danny ran the CLI manually, or (c) a
form-submission route fired.

**What changed (forward-going fix shipped):**

- [x] Added `tryAutoCreateContact()` helper inside `/api/sales-inbox/sync/route.ts`.
- [x] After the existing `emailToContact` lookup misses, the helper picks
      the most-informative external address on the message (sender for
      inbound, first recipient for outbound) and `prisma.person.upsert`s a
      Person row keyed on email.
- [x] Deny-list matches the CLI verbatim:
      internal domains (`opticwise.com`, `nbrain.team`, `nbrain.ai`,
      `nbrain.io`), bounce addresses, `noreply`/`no-reply`/`donotreply`/
      `spamproc`, `receipts@`, `notifications@`, `conversiondocuments@`,
      `offboarding@`, `@em\d+\.` and `@e\d?\.` marketing automation
      patterns, plus the spam-domain list (`fbl.en25.com`,
      `mail.beehiiv.com`, `email.upwork.com`, `news.credaily.com`).
- [x] On upsert, populates `firstName`/`lastName` from the From header's
      display name (`"Cary Johnson" <cary@nbrain.ai>` → firstName `Cary`,
      lastName `Johnson`); falls back to the email username when no
      display name is present.
- [x] Newly-created Person is added to the in-memory `emailToContact` cache
      so subsequent messages in the same sync run reuse it without another
      DB round-trip.
- [x] Tags the row with `contactType = "auto-extracted"` for downstream
      analytics + filtering.
- [x] Returns `autoCreated` count in the sync response payload so dashboard
      and cron logs can monitor the new flow.

**Remaining follow-up (deferred):**

- [ ] One-time backfill: walk every existing `GmailMessage` with
      `personId IS NULL`, run the same auto-create pipeline, and link the
      message after creation. Estimated to grow contact count from 1,128 →
      1,500–2,500 range based on the historical extraction script's output.
- [ ] AI signature-extraction enrichment (proven in the CLI script) as a
      low-priority background job per new Person row to populate `title`,
      `phone`, `linkedInProfile`.

---

## Other Sprint 2 items (placeholders — full issue blocks to be written)

- **3.2** Inline create company/contact picker
- **3.3** Files on deals
- **4.7** Call-recorder classifier + generate-from-transcript + Fathom→Read.ai cleanup

These will get full acceptance-criteria blocks when work begins.
