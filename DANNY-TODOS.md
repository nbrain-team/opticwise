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

---

## 3. Google Workspace Admin — Authorize `drive.file` Scope for the Service Account (one-time)

**Priority:** Sprint 2 (blocks Section 3.3 file uploads going to Drive)
**Opened:** 2026-05-18
**Blocked entity:** OWnet v1 Punch List — Section 3.3 "Files on deals (upload + Drive link + opt-in searchable)"

**Why this is Danny-only:** The OpticWise Google Workspace tenant is administered through nBrain. Domain-wide delegation for the `opticwise-service@opticwise-integration-nbrain.iam.gserviceaccount.com` service account is configured in the Google Workspace admin console, which Bill does not have admin access to.

**Context:** OWnet's 3.3 "Files on deals" feature uploads attachments into Google Drive using the existing service account credentials (`GOOGLE_SERVICE_ACCOUNT_JSON`, already set on the `opticwise-frontend` Render service). The service account currently has read-only Drive access (`drive.readonly`); the upload path requires the **write** scope `drive.file`. Without this, every deal-file upload will fail with a 502 and a clear remediation message in the UI.

**The ask:** Add `https://www.googleapis.com/auth/drive.file` to the service account's authorized OAuth scopes in Google Workspace admin.

**Steps:**

1. Go to https://admin.google.com → **Security** → **Access and data control** → **API controls** → **Manage Domain-wide Delegation**.
2. Find the row for the service account client ID (the numeric ID inside `GOOGLE_SERVICE_ACCOUNT_JSON.client_id` — Bill can read this from the Render env var and DM the digits if needed).
3. Click **Edit** on that row.
4. In the **OAuth scopes (comma-delimited)** box, the current value should already contain at least these (which are the scopes OWnet uses today):
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/drive.readonly`
5. **Add this scope to the list** (separated by a comma):
   - `https://www.googleapis.com/auth/drive.file`
6. Click **Authorize**. The change is effective immediately — no service restart needed on the OWnet side.

**Security note:** `drive.file` is a least-privileged write scope. It grants the service account access **only** to files it itself creates (or that have been explicitly opened via this app), NOT to the user's full Drive. This is the same scope Google recommends for app-managed file uploads.

**Suggested Slack message Bill can paste to Danny:**

> Hey Danny — one quick admin ask. The OWnet 3.3 "Files on deals" feature is wired up to upload attachments into Google Drive using the existing OpticWise service account. The service account currently only has `drive.readonly`; for uploads I need the `drive.file` write scope added in Google Workspace admin (Security → API controls → Manage Domain-wide Delegation → edit the OpticWise service-account row → add `https://www.googleapis.com/auth/drive.file` to the OAuth scopes list).
>
> `drive.file` is the least-privileged write scope (only files the SA creates), so it's tighter than `drive`. Takes 30 seconds in the admin console and unblocks deal file uploads.

**Verification once Danny completes:**
- Bill goes to a deal in OWnet, opens the Files tab, picks a small test file, clicks Upload
- Expected: file uploads, appears in the Files list with size + timestamp, and clicking "Open" navigates to it in the Drive UI under the `OWnet Deal Files` folder in `bill@opticwise.com`'s Drive
- Bill clicks Delete on the test file → confirms it disappears from the OWnet list AND from the Drive folder
- If upload still fails with "INSUFFICIENT_SCOPES" copy, the scope wasn't added or Workspace propagation is still in flight (give it 5 min and retry)

---

# Sprint 2 — Follow-ups (Bill action items)

These are not Danny-blocked — they're deferred follow-ups from Sprint 2 that Bill should action at his convenience. Listed here so nothing falls through the cracks.

---

## F1. Verify Danny Demichele Duplicate Merge in Production

**Priority:** Low (data hygiene, not feature-blocking)
**Sprint origin:** 3.6 (ii) — Contact duplicates
**Opened:** 2026-05-14

**What:** Go to `/contacts/duplicates` in OWnet, find the Danny Demichele group, and click **"Merge others → this"** on the keeper record (`danny@nbrain.ai`). The victim (`danny@nbrain.io` typo address from the PPP Starter Kit signup) will have all its linked deals/emails/activities reassigned to the keeper, and the victim row will be deleted.

**Side note:** Danny's contact card (`cmm3wrcyr01y8ud153uqw4mcj`) currently has `emailWork = ethan@nbrain.ai` (Ethan's email incorrectly saved under Danny). After the merge, manually clear or correct this field on the surviving Danny contact card.

---

## F2. One-Time GmailMessage personId Backfill

**Priority:** Low (improves contact ↔ email linkage for historical data, not blocking any feature)
**Sprint origin:** 3.6 (iii) — Gmail sync gap
**Opened:** 2026-05-14

**What:** The forward-going fix (auto-creating Person records from Gmail sync) is live. But historical `GmailMessage` rows where `personId IS NULL` still exist — these are emails that arrived before the auto-extract was wired in. A one-time backfill script needs to walk those rows, match sender/recipient addresses to existing Person records (or create new ones), and set `personId`.

**Estimated impact:** Contact count could grow from ~1,128 to ~1,500–2,500 range. All those previously-orphaned emails would become browsable under their contact's timeline.

**How to run:** A script (`scripts/backfill-gmail-person-links.ts`) needs to be built and run from the Render shell. This hasn't been built yet — flag it when ready to proceed and we'll build + execute it.

---

## F3. Verify 3.3 File Uploads in Production (blocked on Danny TODO #3)

**Priority:** Medium (feature is deployed but untestable until Danny adds the `drive.file` scope)
**Sprint origin:** 3.3 — Files on deals
**Opened:** 2026-05-18

**What:** Once Danny completes TODO #3 above (adding `drive.file` scope), test the full cycle:
1. Open any deal → Files tab
2. Upload a small test file → confirm it appears with size + timestamp
3. Click "Open" → confirm it opens in Google Drive
4. Paste a Google Drive link → confirm it appears as a linked file
5. Toggle "Searchable" on the uploaded file
6. Delete both files → confirm they disappear from the list (and the uploaded one is removed from Drive)

---

# Sprint 3 — Danny TODOs

---

## 4. LinkedIn Developer App — Create App + Enable Products

**Priority:** Sprint 3 (blocks Section 4.13 Social Posting Tool — LinkedIn direct API)
**Opened:** 2026-05-18
**Blocked entity:** OWnet v1 Punch List — Section 4.13 "Social posting tool (replace Hootsuite)"

**Why this is Danny-only:** The LinkedIn Developer Portal requires a Company Page admin to verify the app. OpticWise's LinkedIn Company Page admin access is managed through nBrain. Bill may be able to create the app himself if he has admin access to the OW LinkedIn page — confirm and delegate accordingly.

**Context:** OWnet is replacing the Zernio middleman with direct LinkedIn API calls. This requires a LinkedIn Developer App with specific API products enabled to post to both personal profiles and company pages.

**Steps:**

1. Go to https://www.linkedin.com/developers/apps → **Create App**
2. App name: `OWnet Social` (or similar)
3. LinkedIn Page: select **OpticWise, Inc.** company page
4. App logo: use OpticWise logo
5. Legal agreement: accept
6. After creation, go to the **Products** tab and request access to:
   - **Share on LinkedIn** — enables posting to personal profiles (`w_member_social` scope)
   - **Sign In with LinkedIn using OpenID Connect** — enables login (`openid`, `profile`, `email` scopes)
   - **Advertising API** OR **Community Management API** — enables posting to company pages (`w_organization_social` scope) and reading organization analytics. Community Management is preferred if available; Advertising API is the fallback.
7. Go to the **Auth** tab:
   - Copy **Client ID** and **Client Secret** — these become `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` env vars on Render
   - Add OAuth 2.0 Redirect URL: `https://ownet.opticwise.com/api/social/callback/linkedin`
8. Add Bill (`bill@opticwise.com`) as an app admin so he can self-serve future changes.

**Note on product approval:** "Share on LinkedIn" is typically instant. "Community Management API" or "Advertising API" may require LinkedIn review (1-5 business days). The personal-profile posting flow will work as soon as "Share on LinkedIn" is approved; company page posting is gated on the org-level product.

**Suggested Slack message Bill can paste to Danny:**

> Hey Danny — for the 4.13 Social Posting Tool (replacing Hootsuite), we need a LinkedIn Developer App so OWnet can post directly to LinkedIn without Zernio. Can you:
>
> 1. Create an app at https://www.linkedin.com/developers/apps — name it `OWnet Social`, associate it with the OpticWise company page
> 2. Request these Products: **Share on LinkedIn** + **Community Management API** (or Advertising API)
> 3. On the Auth tab, add redirect URL: `https://ownet.opticwise.com/api/social/callback/linkedin`
> 4. Send me the **Client ID** and **Client Secret** so I can add them to Render
> 5. Add me as an app admin
>
> Share on LinkedIn should be instant; the org-level product may take a few days for LinkedIn to approve.

**Verification once Danny completes:**
- Bill logs into https://www.linkedin.com/developers/apps and sees the `OWnet Social` app
- Products tab shows "Share on LinkedIn" approved (green checkmark)
- Auth tab shows the redirect URL and Client ID/Secret are accessible
- Bill adds `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` to the Render `opticwise-frontend` service env vars

---

## 5. Meta Developer App — Create App for Instagram Graph API

**Priority:** Sprint 3 (blocks Section 4.13 Social Posting Tool — Instagram integration)
**Opened:** 2026-05-18
**Blocked entity:** OWnet v1 Punch List — Section 4.13 "Social posting tool" — Instagram surface

**Why this may be Danny-only:** The Meta (Facebook) Developer App requires admin access to the Facebook Page linked to the OW Instagram Business account. If Bill has admin access to the OpticWise Facebook Page, he can do this himself.

**Prerequisites to confirm first:**
- The OpticWise Instagram account MUST be an **Instagram Business Account** (not Personal or Creator). Check in Instagram Settings → Account → Account type.
- The Instagram Business Account MUST be linked to a **Facebook Page** (this is how Meta's API routes to it).

**Steps:**

1. Go to https://developers.facebook.com → **My Apps** → **Create App**
2. App type: **Business**
3. App name: `OWnet Social`
4. Business portfolio: select OpticWise's Meta Business portfolio (or create one)
5. After creation, go to **App Dashboard** → **Add Products** → add **Instagram Graph API**
6. Go to **Settings** → **Basic**:
   - Copy **App ID** and **App Secret** — these become `META_APP_ID` and `META_APP_SECRET` env vars on Render
7. Go to **Facebook Login for Business** → **Settings**:
   - Add Valid OAuth Redirect URI: `https://ownet.opticwise.com/api/social/callback/instagram`
8. Request these permissions (under App Review → Permissions and Features):
   - `instagram_basic` — read profile info
   - `instagram_content_publish` — publish posts
   - `instagram_manage_insights` — read analytics
   - `pages_show_list` — list connected Facebook Pages
   - `pages_read_engagement` — read page engagement
9. Submit for App Review (required for production use with non-test users)

**Note:** Meta App Review can take 1-5 business days. In the meantime, the app works in Development Mode for users listed as test users or app admins — so Bill can test immediately.

**Suggested Slack message Bill can paste to Danny:**

> Hey Danny — for the OWnet Social Posting Tool, we also need a Meta (Facebook) Developer App for Instagram posting. Can you:
>
> 1. Confirm the OW Instagram is a Business account linked to a Facebook Page
> 2. Create a Meta app at https://developers.facebook.com — type "Business", name "OWnet Social"
> 3. Add Instagram Graph API product
> 4. Add redirect URL: `https://ownet.opticwise.com/api/social/callback/instagram`
> 5. Request permissions: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`
> 6. Send me the App ID and App Secret
>
> App Review may take a few days, but we can test in Development Mode immediately.

**Verification once Danny completes:**
- Bill logs into https://developers.facebook.com and sees the OWnet Social app
- Instagram Graph API is listed under Products
- Bill adds `META_APP_ID` and `META_APP_SECRET` to Render env vars
- Bill is listed as an app admin or test user for Development Mode testing

---

# Sprint 3 — Willow Voice Agent TODOs

---

## 6. ElevenLabs Willow Webhook — Register URL + Add Env Vars on Render

**Priority:** Sprint 3 (blocks Section 4.8/4.9 Voice Agent CRM integration)
**Opened:** 2026-05-26
**Blocked entity:** OWnet v1 Punch List — Section 4.8 "ElevenLabs / Willow voice"

**Context:** The Willow voice agent is configured in ElevenLabs and the post-call webhook handler is deployed at `/api/webhooks/willow-postcall`. Two environment variables need to be added to the Render `opticwise-backend` service for the webhook to authenticate incoming requests.

**Steps:**

1. **Get the HMAC webhook secret from ElevenLabs:**
   - Go to https://elevenlabs.io → ElevenAgents settings → Webhooks
   - The post-call webhook should already be configured. Copy the **HMAC shared secret** that was generated when the webhook was created.
   - If no webhook exists yet, create one:
     - URL: `https://app.opticwise.com/api/webhooks/willow-postcall`
     - Auth method: **HMAC**
     - Copy the generated secret

2. **Get the ElevenLabs API key:**
   - Go to https://elevenlabs.io → Profile → API Keys
   - Copy an existing key or generate a new one

3. **Add env vars on Render (`opticwise-backend`):**
   - `ELEVENLABS_WEBHOOK_SECRET` = the HMAC secret from step 1
   - `ELEVENLABS_API_KEY` = the API key from step 2
   - Save and trigger a manual deploy

4. **Verify:** Call `888-623-6890`, complete a short conversation with Willow, then check OWnet:
   - A new Deal should appear in **Landing Pages Leads → Willow Inbound Call** stage
   - The deal should have a linked Contact and Activity

**Note on OITVOiP routing:** The Twilio number `888-623-6890` is imported directly into ElevenLabs, which handles the Willow leg. OITVOiP's IVR routes callers to this number as the "new inquiry" option. No additional Twilio configuration is needed.

---

# Sprint 3 — Twilio SMS TODOs

---

## 7. Twilio 10DLC Registration + Env Vars for Outbound SMS

**Priority:** Sprint 3 (blocks Section 4.9 Outbound SMS — Audit Confirmation Texts)
**Opened:** 2026-05-27
**Blocked entity:** OWnet v1 Punch List — Section 4.9 "Twilio (Willow inbound voice + outbound SMS)"

**Context:** When a prospect submits a Schedule Review or PPP Review form and opts in to SMS, they'll receive a confirmation text. This requires 10DLC (10-Digit Long Code) registration with Twilio's TCR (The Campaign Registry) for A2P messaging compliance. The code is deployed and ready — it gracefully skips SMS sending until the env vars are set.

**Step 1 — Identify SMS number:**
- Log into https://console.twilio.com → Phone Numbers → Manage → Active Numbers
- Find or buy a local 10-digit number with SMS capability (NOT the 888 number — toll-free numbers have separate registration requirements)
- Note the number in E.164 format (e.g. `+17205551234`)

**Step 2 — Register 10DLC brand with TCR:**
- In Twilio console: Messaging → Trust Hub → US A2P 10DLC → Brands
- Click "Register a Brand"
- Fill in: legal business name (OpticWise Inc.), EIN, business address, website, vertical (Technology), contact info
- Submit for vetting (typically approved in 1–3 business days)

**Step 3 — Register a Campaign:**
After brand is approved:
- Go to Messaging → Trust Hub → US A2P 10DLC → Campaigns
- Create campaign: use case "Customer Care" or "Marketing"
- Sample message: *"OpticWise: Your review request is confirmed! We'll reach out within one business day. Reply STOP to opt out."*
- Link the SMS number from Step 1
- Submit (carrier approval: 1–5 business days typically)

**Step 4 — Add env vars on Render (`opticwise-backend`):**
- `TWILIO_ACCOUNT_SID` — from Twilio console → Account → API keys & tokens
- `TWILIO_AUTH_TOKEN` — same location
- `TWILIO_SMS_NUMBER` — the E.164 number from Step 1 (e.g. `+17205551234`)
- Save and trigger a manual deploy

**Step 5 — Configure Twilio SMS status webhook:**
- In Twilio console → Phone Numbers → Manage → Active Numbers → click the SMS number
- Under "Messaging", set:
  - **A MESSAGE COMES IN:** Webhook, `https://app.opticwise.com/api/webhooks/twilio-sms-status`, HTTP POST
  - **STATUS CALLBACK URL:** `https://app.opticwise.com/api/webhooks/twilio-sms-status`
- Save

**Step 6 — Re-seed forms (one-time, after deploy):**
Run the form seed script to add the SMS opt-in checkbox to the Schedule Review and PPP Review forms:
```bash
# From the Render shell for opticwise-backend, or locally:
npx tsx scripts/seed-website-forms.ts
```
If the seed script is idempotent/upsert, this just adds the new field. Otherwise, manually add the `sms_opt_in` checkbox field to the two forms via the OWnet admin UI.

**Verification:**
1. Submit a Schedule Review or PPP Review form with a phone number and the SMS opt-in checkbox checked
2. If 10DLC is approved and env vars are set → you should receive the confirmation text
3. Reply STOP → the Person record in OWnet should get `smsOptedOut = true`
4. Submit again with the same number → no SMS sent (opt-out respected)

**Timeline:** 10DLC brand + campaign registration typically takes 1–6 weeks total. The code handles this gracefully — while waiting, form submissions work normally; SMS is just skipped with a server log warning.
