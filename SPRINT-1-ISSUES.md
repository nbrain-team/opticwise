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
**Status:** **PR open** (branch `sprint-1/3.5-deal-email-overmatch-fix`, pushed 2026-05-12 01:20)
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 3.5
**Labels:** `sprint-1`, `bug`, `crm`, `priority:high`
**Branch:** `sprint-1/3.5-deal-email-overmatch-fix`
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
- [ ] **(verify)** Verified on the Harlow Spring Cypress (Houston) / Aspen Oak (GHIS) deal — see issue 3.1 — should close with this fix
- [ ] **(verify)** Verified on at least 2 other production deals (one with a Gmail-domain primary contact, one with a corporate-domain primary contact)

### Known limitations / follow-ups (not blocking merge)

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
**Status:** Verification rides on the 3.5 PR. Confirm post-deploy.
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 3.1
**Labels:** `sprint-1`, `verify-only`, `crm`
**Branch:** `sprint-1/3.5-deal-email-overmatch-fix` (verification rides on the 3.5 PR)
**Owner:** WD (Bill via me)
**Effort:** `XS` (verification-only)
**Depends on:** Issue 3.5

### Context

The new Harlow Spring Cypress (Houston) / Aspen Oak (GHIS) deal showed Bill's entire inbox under Emails despite Email Messages count = 0. Diagnosed as the same root cause as 3.5.

### Acceptance criteria

- [ ] Open the Harlow / Aspen Oak deal post-3.5 deploy
- [ ] Emails tab shows zero or only the genuinely-linked emails — NOT the full inbox
- [ ] If the deal still shows stale matches, run the one-time cleanup migration that purges the bad `threadLinkedEmails` rows for this deal id and re-runs the matcher

---

## Issue: Sprint 1 / 3.4 — Verify Danny's pipeline edit/add + MTU Tenant Pipeline fix

**Sprint:** 1
**Punch-list item:** 3.4
**Plan reference:** `opticwise/OWNET-V1-PUNCH-LIST-PLAN.md` Section 3.4
**Labels:** `sprint-1`, `verify-only`, `crm`
**Branch:** `sprint-1/3.4-pipeline-verify` (only if a code change is needed; verification can ride main)
**Owner:** WD
**Effort:** `XS` (verification-only)

### Context

Bill (2026-05-11): "This has been corrected separately by Danny. Consider it done."

We still want a quick verification pass so we know the fix landed correctly and the `MTU Tenant Pipeline` is reachable from the deal-create form's pipeline picker.

### Acceptance criteria

- [ ] Pipeline admin (`/pipelines` or wherever it lives) supports add + edit operations end-to-end
- [ ] `MTU Tenant Pipeline` is selectable on the deal-create form
- [ ] Existing deals on other pipelines still load correctly (no regression on the deals-page filter)
- [ ] If anything is still broken, re-open this issue with a specific repro

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
