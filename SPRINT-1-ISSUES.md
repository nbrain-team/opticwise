# Sprint 1 — GitHub Issues (Ready to File)

**Sprint goal:** Stop the bleeding. CRM email + pipeline correctness, Slack integration unblocked, PPP forms verified.

**Operating principles (from OWNET-V1-PUNCH-LIST-PLAN.md cross-cutting answers):**
- v1 is overdue → ship fastest viable path
- WD = Bill Douglas, DH = Drew Hall, DD = Danny DeMichele
- Render-only, no portability abstractions
- Fix-inline policy: adjacent broken things land in the same PR with an "incidental fix: X" note
- Lightweight PR model: single `main`, branches per Sprint item, one ✅ then self-merge

**How to use this file:**
- Each `## Issue: ...` block below is ready to copy/paste into github.com/nbrain-team/opticwise/issues/new
- Title goes in the title field; everything from `**Sprint:**` down through the end of the block goes in the body
- Suggested labels are listed; create any that don't yet exist (`sprint-1`, `bug`, `crm`, `slack`, `blocked`, `verify-only`)
- Branch names follow `sprint-1/<item-number>-<slug>` convention

---

## Issue: Sprint 1 / 3.5 — Emails linked to a deal don't actually show in the deal

**Sprint:** 1
**Punch-list item:** 3.5
**Status:** ✅ **SHIPPED to main 2026-05-13 18:02 MDT** (commit `aaa737a`, cherry-picked from `sprint-1/3.5-deal-email-overmatch-fix` to avoid unrelated Insights/users work that had accumulated on that branch). Deployed live on both `opticwise-frontend` and `opticwise-backend` at 2026-05-13 18:07 MDT. **Verified in production** on three deals (see below).
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 3.5
**Labels:** `sprint-1`, `bug`, `crm`, `priority:high`
**Branch (orphaned):** `sprint-1/3.5-deal-email-overmatch-fix` — DO NOT MERGE (carries 31 extra files of Insights/users work that needs separate review)
**Owner:** WD (Bill via me)
**Effort:** `S–M`

### Context

Bill confirmed (2026-05-11): "I think it has possibly been resolved. Regarding the sync, I would like it to be automatic."

The deal detail page's "Emails" tab over-matches against the logged-in user's entire inbox instead of just emails tied to the deal's contacts/company. New deals exhibit this badly (e.g. Harlow Spring Cypress / Aspen Oak — see issue 3.1).

Source of the bug is in `opticwise/ow/app/deal/[id]/page.tsx` — the email-matching join uses generic-domain matches and includes the owner's own email in candidate matches, plus the `threadLinkedEmails` join is loose.

### Acceptance criteria

- [x] **(code)** Deal Emails tab shows ONLY: (a) explicitly dealId-linked emails, plus (b) emails whose Gmail-sync resolved `personId` is on the deal's contact list, plus (c) emails to/from any contact email address on the deal — with the logged-in user's email NEVER matched, and generic free-mail domains never used as the deal's domain.
- [x] **(code)** The logged-in user's own email address is NEVER used as a match key (hard-coded exclusion + belt-and-suspenders filter on inferred matches)
- [x] **(code)** `EmailThread`-by-subject fuzzy join REMOVED entirely. Replaced by `personId in [dealContacts]` direct match, which is more precise.
- [x] **(code)** UI exposes "Show inferred / Hide inferred" toggle in `EmailsTab` (default OFF) with a count callout. Only renders when inferred matches exist.
- [x] **(verify)** Sync to Gmail runs automatically — verified **2026-05-13** via Render MCP (not dashboard). **Cron job:** `opticwise-email-sync` (`crn-d6c9sv3h46gs738e4isg`) — schedule `*/15 * * * *`, **not suspended**, `lastSuccessfulRunAt` fresh. Command: `GET https://ownet.opticwise.com/api/sales-inbox/sync?secret=$CRON_SECRET`. Recent logs show **`"success":true`** and **`"usersSynced":2`** (Bill + Drew mailboxes); runs complete with **"Cron job run finished successfully"**. Dashboard: https://dashboard.render.com/cron/crn-d6c9sv3h46gs738e4isg
- [x] **(verify 2026-05-13 18:10 MDT)** Harlow Spring Cypress (Houston) / Aspen Oak (GHIS) — 0 stakeholders, no org → went from **~50 unrelated inbox emails** → **1 legitimate email** (Kyle Clark, "Harlow Spring Cypress — On-site Digital Infrastructure Review", direct `GmailMessage.dealId` link). Closes 3.1 as well.
- [x] **(verify 2026-05-13 18:11 MDT)** PPP Starter Kit — Danny DeMichele — 1 stakeholder (`danny@nbrain.ai`, emailWork `ethan@nbrain.ai`) → shows ~95 emails, **every one** legitimately involves Danny or his nBrain colleagues. No random inbox content. Address-match path (c) + personId path (b) firing as designed.
- [x] **(verify 2026-05-13 18:12 MDT)** PPP Starter Kit — bill bobo — 1 stakeholder (`bill.douglas.co@gmail.com`, Bill's *personal* Gmail) → shows 44 emails, **every one** genuinely contains `bill.douglas.co@gmail.com` in from/to/cc (forwards Bill sent to himself, contracts signed under that address). This is a self-test edge case where the stakeholder IS the deal owner under a different email; in real customer deals this won't happen.

### Production data observation (recorded for context)

At deploy time (2026-05-13), **zero** open deals in production have an `Organization.domain` populated. That means the inferred-tier path (d) — org-domain match with the "Show inferred" toggle — is currently dormant in the UI. As Bill starts populating org domains on real deals, that path will activate. The blocklist-aware logic for generic free-mail domains is in place from day one.

### Known limitations / follow-ups (not blocking)

- **Data hygiene flagged for 3.6 contact dedup:** Danny's contact card has `emailWork = ethan@nbrain.ai` — that's Ethan's email saved under Danny, which causes Ethan's emails to leak into every deal Danny is on. Fix in 3.6 (contact merge / hygiene sweep).
- Address-match against contact emails uses `email` and `emailWork` only (not `emailHome`/`emailOther`). The dealContacts include block doesn't fetch those two columns. If a customer has their primary email in `emailHome` we'll miss them — extremely rare in B2B context. Capture as a future improvement if it surfaces.
- The 100-email cap per source list (400 max into dedup) is generous but finite. If we ever see deals with >100 emails per source where the most-recent slice doesn't fit, expose a "show all in mailbox" link to the full search.

### Fix-inline candidates flagged for incidental cleanup in the same PR

- Any obvious N+1 queries on the deal page's email panel
- Any error-swallowing `catch` blocks in the email-match pipeline (replace with structured logs)
- Stale Fathom references in the deal page if any remain (Read.ai migration cleanup per Section 4.7)

---

## Issue: Sprint 1 / 3.1 — Harlow Spring Cypress / Aspen Oak deal cleanup (verify)

**Sprint:** 1
**Punch-list item:** 3.1
**Status:** ✅ **CLOSED 2026-05-13 18:10 MDT** — shipped & verified together with 3.5 in commit `aaa737a`.
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 3.1
**Labels:** `sprint-1`, `verify-only`, `crm`
**Branch:** shipped via `main` (cherry-picked 3.5 fix)
**Owner:** WD (Bill via me)
**Effort:** `XS` (verification-only)
**Depends on:** Issue 3.5

### Context

The new Harlow Spring Cypress (Houston) / Aspen Oak (GHIS) deal showed Bill's entire inbox under Emails despite Email Messages count = 0. Diagnosed as the same root cause as 3.5.

### Acceptance criteria

- [x] Opened the Harlow / Aspen Oak deal post-deploy on `ownet.opticwise.com`
- [x] Emails tab now shows **1 legitimate email** (Kyle Clark, "Harlow Spring Cypress — On-site Digital Infrastructure Review", deal-related, linked via `GmailMessage.dealId`) instead of ~50 unrelated inbox messages
- [x] No stale `threadLinkedEmails` cleanup migration needed — the fix removed the bad join entirely, so old rows are simply ignored on every page render

---

## Issue: Sprint 1 / 3.4 — Verify Danny's pipeline edit/add + MTU Tenant Pipeline fix

**Sprint:** 1
**Punch-list item:** 3.4
**Status:** ✅ **CLOSED 2026-05-13 18:21 MDT** — verified end-to-end in production.
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 3.4
**Labels:** `sprint-1`, `verify-only`, `crm`
**Branch:** n/a (verification rode `main`; no code change needed)
**Owner:** WD
**Effort:** `XS` (verification-only)

### Context

Bill (2026-05-11): "This has been corrected separately by Danny. Consider it done."

Quick verification pass so we know the fix landed correctly and the `MTU Tenant Pipeline` is reachable from the deal-create form's pipeline picker.

### Verification results (2026-05-13 18:21 MDT)

DB state confirmed via `opticwise-postgres` MCP — 3 pipelines exist:

| Pipeline | Stages | Deals |
|---|---|---|
| New Projects Pipeline (`cmi4xt6lq...`) | 7 | 9 |
| MTU Tenant Pipeline (`cmme0j5bg...`) | 5 | 0 |
| Landing Pages Leads (`cmn6jxtv3...`) | 4 | 6 |

UI state verified live on `ownet.opticwise.com`:

- [x] Pipeline admin lives at `/settings#pipelines` (route is via the Settings sub-nav, not `/pipelines` which is 404). Pipeline Manager UI supports: rename pipeline, delete pipeline, add stage, rename stage, delete stage, "+ New Pipeline" creation. Each pipeline shows its deal count badge.
- [x] `MTU Tenant Pipeline` switcher button on `/deals` is present and clickable; clicking switches the URL to `/deals?pipeline=cmme0j5bg0000o3278tcmrfcm`, the Open count drops to `(0)`, and the kanban shows MTU's 5 stages (Tenant Identified → Negotiations Started).
- [x] `MTU Tenant Pipeline` stages are selectable on the deal-create form (`/deals/new?pipeline=<MTU id>`) — all 5 stages render in the `Pipeline Stage` dropdown.
- [x] Existing deals on other pipelines still load correctly — verified by clicking back to `New Projects Pipeline` (9 deals render across 7 stages with proper drag handles).

### Bug fixed (Bill's original complaint)

The PDF noted: *"There is no 'MTU Tenant Pipeline'. There's only one pipeline and nothing changes when I click the pipeline differentiators buttons to the right of 'Deals' text."* Both halves are now fixed — the pipeline exists, the differentiator buttons trigger an actual URL change + kanban swap.

### Side-finding flagged for Sprint 2 / 3.2

The deal-create form's `Organization` dropdown has **825 options** and `Contact Person` has **1,129 options** — confirming Bill's 3.2 complaint about "find them from a very long list." That's our Sprint 2 work (inline-create combobox).

---

## Issue: Sprint 1 / 4.3 — Slack AI assistance fully live (BLOCKED on Danny)

**Sprint:** 1
**Punch-list item:** 4.3
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 4.3 + `opticwise/DANNY-TODOS.md` item 1
**Labels:** `sprint-1`, `blocked`, `slack`, `integration`
**Branch:** `sprint-1/4.3-slack-bot-go-live`
**Owner:** DD then WD
**Effort:** `S` (config + minor wiring)

### Context

OWnet Slack bot needs collaborator access + scopes added before it can do anything useful (DMs, channel listening, @-mention responses). Owner of the Slack app is Danny — see `DANNY-TODOS.md` item 1 for the full ask.

### Acceptance criteria — Danny's part

- [ ] DD adds WD as Collaborator on the OWnet Slack app at https://api.slack.com/apps
- [ ] DD adds scopes: `users:read`, `channels:read`, `channels:history`, `im:history`, `im:read`, `im:write`, `chat:write`, `app_mentions:read`
- [ ] DD enables Event Subscriptions: `app_mention`, `message.im`
- [ ] DD reinstalls the app to the workspace

### Acceptance criteria — WD's part (after Danny ships)

- [ ] Verify scopes are present on the OAuth & Permissions page
- [ ] Confirm `SLACK_BOT_TOKEN` env var is the post-reinstall token (rotate if necessary)
- [ ] Bot responds to a test @-mention in `#general`
- [ ] Bot responds to a test DM from WD
- [ ] Bot posts a test summary (Phase-1 behavior per Section 4.3 answer)

---

## Issue: Sprint 1 / 2.1 — PPP forms sweep (CLOSED by WD)

**Sprint:** 1
**Punch-list item:** 2.1
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 2
**Labels:** `sprint-1`, `closed-on-create`, `documentation`
**Owner:** WD
**Effort:** None (closed-on-create)

### Context

Bill (2026-05-11): "Everything relative to the two websites, both the PPP and the OW website, can be considered done. There's nothing else needed here."

File this issue and immediately close it with the comment: "Closed by WD executive decision 2026-05-11; reference plan doc Section 2."

The issue exists only so Sprint 1's board reflects the close, not as live work.

---

# Bulk-creation tip

If you want to skip the GitHub UI entirely, install `gh` via `brew install gh` (or download the macOS pkg from https://cli.github.com/) and let me know — I can then create all 5 issues in one shell command in ~30 seconds.

Until then, this file IS the tracking artifact. I'll update each block's checkboxes here as work lands, and reflect status in `OWNET-V1-PUNCH-LIST-PLAN.md`.
