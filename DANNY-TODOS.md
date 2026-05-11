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

### 1b. Add Three Bot Token Scopes + Reinstall (~2 minutes)
- Same Slack app config page (https://api.slack.com/apps → `ownet` app)
- Left sidebar → **"OAuth & Permissions"**
- Scroll to **"Bot Token Scopes"** section
- Click **"Add an OAuth Scope"** three times, adding each of:
  - `users:read`
  - `channels:read`
  - `channels:history`
- Scroll to top of the same page — a yellow banner says *"Your app's permissions have changed — please reinstall your app"*.
- Click **"Reinstall to Workspace"** → on the consent screen, click **"Allow"**.

After reinstall, the Bot Token Scopes list shows the three new scopes alongside whatever was already there.

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
