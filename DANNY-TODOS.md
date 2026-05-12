# TODOs for Danny — Action Items From OWnet v1 Punch List

This file tracks discrete asks for Danny DeMichele (nBrain) that must be completed by him because of admin/ownership/collaborator boundaries that Bill can't bypass.

Each item lists: what's needed, why, who's blocked, suggested wording for the Slack message to Danny.

---

## 1. Slack App — Add Bill as Collaborator + Add Three Scopes

**Priority:** Sprint 1 (blocks Section 4.3 Slack integration)
**Opened:** 2026-05-11
**Blocked entities:**
- OWnet v1 Punch List — Section 4.3 "Slack — intelligent AI chat & assistance" question 1.
- Cursor MCP-Slack bridge (configured but never installed per May 8 weekly update).
- Any future Slack-aware feature inside OWnet that needs to enumerate users, list channels, or read channel history.

**Why this is Danny-only:** Danny created the OWnet Slack app under his own developer account, so the OAuth & Permissions page is gated to him + any collaborators he's added. Bill is currently NOT a collaborator (confirmed via screenshot 2026-05-11 — the Slack marketplace view says *"This app was created by Danny DeMichele. Ask them for installation instructions or to add you as an app collaborator to install this app for yourself."*).

**Two-part ask:**

### 1a. Add Bill as Collaborator on the OWnet Slack App (one-time)
- Go to https://api.slack.com/apps
- Pick the `ownet` app
- Left sidebar → **"Collaborators"**
- Click **"Add Collaborator"**, enter `bill@opticwise.com`
- Set role: **"Workspace Member"** or **"Workspace Owner"** (whichever the Slack UI offers — owner gives full edit rights)
- Save

This is one-time. After this, Bill can self-serve all future Slack app config changes — scopes, event subscriptions, slash commands, OAuth redirects, etc.

### 1b. Add Bot Token Scopes + Event Subscriptions + Reinstall (~5 minutes)

**Updated 2026-05-11** to include DM-conversation support (Phase 1 of the bot rollout per punch-list answer 4.3.2).

**OAuth & Permissions → Bot Token Scopes** — add these (some may already exist):

Read scopes (programmatic):
- `users:read`
- `channels:read`
- `channels:history`

DM + conversation scopes (so the bot can converse via DM):
- `im:history`
- `im:read`
- `im:write`
- `chat:write` (almost certainly already present — confirm)
- `app_mentions:read` (almost certainly already present — confirm)

**Event Subscriptions** (left sidebar → "Event Subscriptions"):
- Make sure event subscriptions are **Enabled**
- Request URL should already point at the OWnet platform's Slack events endpoint (`https://ownet.opticwise.com/api/slack/events`) — confirm green checkmark
- Under "Subscribe to bot events", make sure these are present:
  - `app_mention` (bot reacts to @-mentions)
  - `message.im` (bot receives DMs)

**Reinstall:** scroll to top of OAuth & Permissions; the yellow banner *"Your app's permissions have changed — please reinstall your app"* appears → click **"Reinstall to Workspace"** → on the consent screen, click **"Allow"**.

After reinstall, the Bot Token Scopes list shows everything above, AND the bot can receive @-mentions and DMs.

**Suggested Slack message Bill can paste to Danny:**

> Hey Danny — two asks for the OWnet Slack app:
>
> 1. Please add me (`bill@opticwise.com`) as a **Collaborator** on the OWnet Slack app at https://api.slack.com/apps. Once I'm in, I can self-serve future scope/permission changes.
>
> 2. While you're in there, can you add three Bot Token Scopes — `users:read`, `channels:read`, `channels:history` — and Reinstall to Workspace? This unblocks the May 8 MCP-Slack bridge that's been waiting on these.
>
> Thanks!

**Verification once Danny completes:**
- Bill goes to https://api.slack.com/apps, sees the `ownet` app listed, can click into OAuth & Permissions
- Bot Token Scopes section shows all three new scopes
- Bill messages this thread; we resume Section 4.3 (which also has open sub-questions about whether to make the bot conversational, and channel-vs-mention behavior)

---

## 2. Digital Book Shipping — Define the Drop-Ship Process Behind the Scenes

**Priority:** Sprint 4 (Lead Engine) — blocks Section 5.2 of the punch list
**Opened:** 2026-05-11
**Blocked entity:** OWnet v1 Punch List — Section 5.2 "Digital book shipping (currently broken)"

**Why Danny:** Danny has experience in drop-shipping. Before we build the landing page / form / fulfillment pipeline, we need the actual end-to-end **operational process** scoped — vendor relationships, storage, file delivery, tracking, customer service handoff if delivery fails. This is operations design, not just engineering.

**The ask:** Danny defines the digital-book-shipping process flow so Bill + I can then design the technical surface (form fields, post-submit email sequence, fulfillment trigger, status tracking inside OWnet).

**Questions for Danny to answer (so we can build):**

1. **What's being shipped?** Digital book = PDF? EPUB? Audiobook MP3? Multiple formats bundled? Hosted Drive link with view-only access? Or some other delivery mechanism?
2. **Where does the digital content live?** Permanent URL (S3 bucket? Drive folder? CDN?) that we link to in the email — and is the link single-use (expiring/tokenized) or evergreen-public?
3. **What's the fulfillment trigger?** Form submission → email sends within X seconds (full auto), or → manual approval gate → human releases the link?
4. **What customer info do we collect?** Beyond name + email — do we need work email vs. personal email, company, role, portfolio size (matches PPP Audit form), shipping/billing address (NO if digital-only), industry, etc.?
5. **What happens if the email bounces or the link click never happens?** Retry sequence? Manual outreach? Lead stays in CRM as "warm but unfulfilled"?
6. **Pricing / payment?** Free download for marketing/leadgen, or paid? If paid: what payment processor (Stripe / Paddle / direct invoice), at what price, and what's the refund policy?
7. **Anti-abuse?** Bot/scraper protection (rate-limit per IP, captcha, honeypot)? Limit downloads per email address?
8. **Tracking?** Do we want to know who actually opened/read the book vs. just downloaded? (PDF tracking is hard; Drive view-only-link tracking is easy.)
9. **CRM integration:** does the digital-book submission create a Contact + Deal in *PPP book leads* (existing stage) or a new stage? Confirm the existing stage is correct for v1.
10. **Physical book hand-off path:** Bill flagged physical book shipping (5.3) as a future project, but if someone requests both, how should the digital path lead into the physical path eventually? Decision can defer.

**Suggested Slack message Bill can paste to Danny:**

> Hey Danny — we're rebuilding the digital book shipping lead-magnet flow (the one that's currently broken per the v1 punch list).
>
> Before we put any technical work into it, I want to lean on your drop-ship experience to scope the process end-to-end. Can you walk through:
> 1. What format the digital book ships in (PDF/EPUB/etc.) and where the content file lives
> 2. The fulfillment trigger (auto vs. manual approval)
> 3. What customer info we collect on the form
> 4. Retry / unfulfilled flow if the email bounces
> 5. Any pricing/payment piece if it's not free
> 6. Anti-abuse + tracking expectations
>
> Once I have those operational answers, the technical build is straightforward. Thanks!

**Once Danny responds:**
- Bill posts the process flow back into this thread
- We then design the form, email sequence, CRM hookup, and any fulfillment automation accordingly
- Update Section 5.2 of the punch list with the agreed process and re-open the build task
