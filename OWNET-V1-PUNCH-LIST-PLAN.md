# OWnet v1 Punch-List — Plan & Open Questions

**Source:** `OWnet v1 punchout list.pdf` (Bill's annotated PDF, AA DOWNLOADS - WD rev 2025-Apr)
**Owner of this doc:** Bill (WD) — answers go inline under each "Questions for Bill" block
**Last updated:** May 11, 2026

---

## How to use this document

For each punch-list item I've broken it into:

- **What the PDF says** — verbatim from your list so nothing gets lost in translation
- **Where we are today** — what's already built in OWnet (so we don't redo work)
- **Gap to "done"** — the actual remaining work
- **Questions for Bill** — short, specific decisions only you can make
- **Recommended approach** — how I'd tackle it once your answers are in
- **Effort tier** — `S` (≤ ½ day), `M` (1–3 days), `L` (1+ weeks), `XL` (multi-week / multi-phase)

At the end there's a **Recommended sequence** that orders everything by dependency + pain × effort, plus a **Global / cross-cutting questions** block for things that don't belong to a single item.

Once you fill in the question blocks we tackle them one section at a time — I'll convert each section into discrete commits/PRs.

---

# 1. AI Training

## 1.1 PPP book ingested to OWbrain
- **PDF:** "WD has in in .md form if that helps"
- **Where we are today:** Content Engine canon ingestion (`ow/scripts/ingest-content-engine-canon.ts`) already classifies and loads `.md`/`.txt`/`.docx` files into `KnowledgeDocument` + `KnowledgeChunk` with `category = "Canon — *"`. PPP book manuscript is one of the recognized canon classes (per 2026-05-07 update).
- **Gap to "done":** Confirm the `.md` version of the PPP book is the one currently chunked, that retrieval boosts it appropriately for PPP-flavored queries, and that nothing else (older PDF, draft chapters) is competing in the vector store.
- **Questions for Bill:**
  1. Where is the canonical `.md` of the PPP book? (One folder I should treat as the single source of truth.)
     - **Answer (2026-05-11):** `/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/AI working files/peak_property_performance.md` (3,643 lines, ~315KB). This is the single source of truth; ingester should point here.
  2. Are there chapters/sections you do NOT want the agent to quote verbatim (e.g., parts still being edited)?
     - **Answer (2026-05-11):** None — all of it is fair game.
  3. Should PPP book chunks have a higher retrieval weight than blog/LinkedIn content? Default is equal.
     - **Answer (2026-05-11):** Boost book higher — it's the authoritative source for foundational concepts.
- **Recommended approach:** Re-run the canon ingester pointed at the `.md` folder with `--reingest`, delete any older PDF-derived chunks, apply higher retrieval weight to book chunks (tag with `category = "Canon — PPP Book"` and boost score in retrieval), verify with 5 probe queries.
- **Effort:** `S`

## 1.2 WD & DH digital twins built or copied
- **PDF:** "DD: I have no problem with OWbrain knowing me, so I don't have to be isolated… can give you everything it needs to train on me if it can't dump the customGPT… Just LMK and I'll put them in folders for each"
- **Where we are today:** Brand voice canons for **Bill** and **Drew** are already separated in `ow/lib/brandscript-prompt.ts` with a `author` parameter. Voice exemplars are ingested per-author into `StyleGuide` with `author = "Bill" | "Drew"`. So WD and DH have *brand voice* twins. We don't yet have *personal operating* twins (i.e., "what would Bill/Drew decide on X").
- **Gap to "done":** Decide whether "digital twin" = voice (done) or behavioral/decision twin (not done). If behavioral, we need a persona prompt + a personal-correspondence corpus (emails, Slack DMs, meeting transcripts where you're the speaker).
- **Questions for Bill:**
  1. Define "digital twin" for each of WD and DH: **(a) voice clone for writing**, **(b) decision/advisor agent that responds to questions as if it were you**, or **(c) both**?
     - **Answer (2026-05-11):** Digital twins are defined by two existing files that are now the single source of truth:
       - Bill: `/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/AI working files/BILL_DOUGLAS_AI_OS_v1.md`
       - Drew: `/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/AI working files/DREW_HALL_AI_OS_v1.md`
       - When OW employees ask OWnet for LinkedIn posts, responses, emails, or any content **explicitly in Bill's voice or Drew's voice**, the OWnet agent must refer to the matching file as the persona/voice canon.
       - **Codified as a Cursor project rule:** `.cursor/rules/bill-drew-digital-twin-voice.mdc` (alwaysApply: true).
       - **Build task implied:** ingest both files into the OWnet knowledge base as `category = "Canon — Digital Twin"` with `author = "Bill" | "Drew"`, and update the OWnet agent's system prompt so explicit "Bill's voice" / "Drew's voice" requests load the corresponding file as the persona.
  2. For Danny (DH) — he offered to dump his customGPT exports into per-person folders. Has that landed anywhere yet? If not, what's the ETA so we can ingest?
     - **Moot (2026-05-11):** Twin is defined by the AI OS file, not by ingested personal correspondence. No customGPT dump required for v1.
  3. Is there any class of personal correspondence (medical, legal, family) that must be **excluded** from the twin training set?
     - **Moot (2026-05-11):** Same as #2 — no personal correspondence is being ingested for the twin, so exclusion rules don't apply for v1.
  4. Should the twins be **callable as named agents** inside OWnet (e.g., `/agent/wd` and `/agent/dh` chat surfaces) or just **as personas** the main agent adopts when asked?
     - **Answer (2026-05-11):** Both. Expose dedicated chat surfaces (`/agent/bill` and `/agent/drew`) that always open in that persona, **and** keep the main OWnet agent capable of adopting either persona when a user asks "in Bill's voice" / "as Drew."
- **Recommended approach:** Build a `Persona` config + named chat routes `/agent/bill` and `/agent/drew` that load the corresponding AI OS file into the system prompt, and add the same persona-load logic to the main `/ownet-agent` route when the user's request explicitly names Bill or Drew.
- **Effort:** `M` (voice-only persona load; AI OS files are the canon, no behavioral corpus to gather).

## 1.3 2 customGPTs fully imported, or rebuilt (Marketing & Sales)
- **PDF:** "includes objection handling from GPT's and WD emails"
- **Where we are today:** OWnet agent already has a unified system prompt and Content Engine mode for marketing content. There is **no** dedicated `marketing-agent` or `sales-agent` surface yet, and no objection-handling corpus has been called out as ingested.
- **Gap to "done":** (1) Get the customGPT export OR rebuild from prompt + knowledge files; (2) ingest objection-handling corpus from WD emails; (3) decide if these become **modes** of the OWnet agent or **separate sub-agents**.
- **Questions for Bill:**
  1. Did ChatGPT ever return the customGPT export? If not, do we have the **system prompts** and the **knowledge file list** captured anywhere (screenshots, copy/paste in Slack)?
     - **Answer (2026-05-11):** ChatGPT never returned the export. Bill instead built a **combined Marketing + Sales Claude project** that supersedes the original customGPTs and is more recent/consolidated. The Claude project content is captured locally in `/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/AI working files/`. Bill's Claude account itself is not accessible programmatically — the local files are the rebuild corpus.
     - **Key finding (2026-05-11):** The OWnet canon ingester already runs against `/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/Claude CoWork Projects/OpticWise Content Engine/` and has already ingested the SB7 BrandScript, Sales Playbook, Bill+Drew AI OS, AssetManager Overlay, BrandVoice KeyCrew, Brandscript Best Examples, PPP book, Drew transfer pack, CLAUDE.md, CONTENT_BACKLOG, OW Blog exemplars, and OpticWise_Content_Engine_FINAL.md. **No re-ingestion of those needed.**
     - **Net-new files in `AI working files/` to ADD** (decision 2026-05-11): ingest all of these once Bill's parallel edits settle —
       - `OpticWise_Wins_Nightmares_Library_Canonical_v2026-05c.md` *(actively being edited in another chat — coordinate before re-ingest)*
       - `OpticWise_Competitive_Landscape_2026-Apr.md`
       - `OpticWise_Succinct_Competitive_Battlecard_v2.txt`
       - `OpticWise_Competition_Battlecard_Full_Transcript.json` *(requires ingester to stop skipping `.json`, or convert to `.md` first)*
       - `OW_KeyCrew_Canonical_Updates.md`
       - `OW_KeyCrew_Content_Pack.md`
       - `OW_Big_Three_Plays_Diagnostic.md`
       - `WD2_Sales_Reframe_Playbook.md`
       - `Creighton_Archetype_Playbook_for_Slack.md`
       - `OpticWise_Market_Context_Brief_April2026.docx.md`
       - `PPP Podcast Transcript Automation Spec.md`
     - **Explicit exclusions:**
       - `OpticWise_Cowork_Project_Instructions_UPDATED (2).md` — **DO NOT INGEST.** Bill is not using Claude Cowork; its contents would confuse the agent.
       - `opticwise_execution_brain_trust_export.md` — in the WEISS subfolder; treat as client-specific until Bill says otherwise.
       - `from ChatGPT - OpticWise Content Operating System (2026).md` — older small file likely outdated; skip unless Bill flags it.
     - **Build task implied:** (1) extend `ingest-content-engine-canon.ts` classifier patterns to recognize the new file types (`wins_nightmares` → `Canon — Sales Library`, `competitive_landscape`/`competition_battlecard` → `Canon — Competitive`, `keycrew` → `Canon — Voice/Sales`, `big_three_plays` → `Canon — Sales Plays`, `sales_reframe` → `Canon — Sales Playbook`, `creighton_archetype` → `Canon — Persona Archetype`, `market_context_brief` → `Canon — Market Context`, `ppp podcast transcript automation` → `Canon — Workflow`); (2) optionally stop skipping `.json` so the battlecard transcript can be ingested; (3) add a hard exclusion list with the Cowork file; (4) run after Bill confirms Wins & Nightmares edits are stable.
  2. For "objection handling from WD emails" — which mailbox/label is the source corpus? Is there a Gmail label I should target (e.g., `objection-handling`, or specific senders)?
     - **Answer (2026-05-11):** Skip emails for now. Past emails have already been reviewed and the relevant material is captured in `SALES_PLAYBOOK.md`, `OpticWise_Wins_Nightmares_Library_Canonical_v2026-05c.md`, and the other canonical documents. If a future review of emails is needed, we'll revisit — but no email ingestion for this scope.
  3. Marketing GPT and Sales GPT: do you want them as **two visible modes** on the OWnet agent dropdown (alongside "Content Engine"), or as **two separate `/agent/marketing` and `/agent/sales` pages**?
     - **Moot (2026-05-11):** No separate Marketing/Sales agent surfaces are needed. The customGPTs' content has been fully transferred into the canonical Markdown docs already living in `/Users/billdouglas/My Drive/AA DOWNLOADS - WD rev 2025-Apr/AI working files/` (and partly already ingested via the Content Engine canon). The OWnet agent will draw from those canon chunks at retrieval time — no separate modes/pages required.
  4. Who is allowed to use each? (Sales GPT might leak pricing strategy — RBAC matters here.)
     - **Moot (2026-05-11):** No separate Sales/Marketing agent surfaces; RBAC question is rolled into the broader OWnet agent access control covered in other items.
- **Revised resolution (2026-05-11):** Item 1.3 is effectively resolved by canon ingestion (Question 7). No `agent_mode` table, no separate `/agent/marketing` or `/agent/sales` routes. The only remaining work is the canon-extension build task captured under Question 7 (extend classifier patterns, ingest the net-new files, run after Wins & Nightmares edits settle).
- **Effort:** Fully covered by the Question 7 build task. No additional work attributable to this item.

## 1.4 OW market research info imported
- **Where we are today:** Bill says competitive info was provided to Danny + lives in a Slack tab. Unclear what's actually in the vector store today.
- **Questions for Bill:**
  1. Where does the market research live now (Google Drive folder path, Slack canvas link, specific files)?
     - **Answer (2026-05-11):** Fully covered by the competitive + market files already queued for ingestion in Question 7 (`OpticWise_Competitive_Landscape_2026-Apr.md`, `OpticWise_Succinct_Competitive_Battlecard_v2.txt`, `OpticWise_Competition_Battlecard_Full_Transcript.json`, `OpticWise_Market_Context_Brief_April2026.docx.md`). No additional sources to import.
  2. Is this static (one-time import) or living (you'll keep adding research)? If living, do you want auto-watch on a Drive folder?
     - **Moot (2026-05-11):** Resolved by #1.
- **Status (2026-05-11):** **Closed.** No additional work beyond the Question 7 ingestion task.

## 1.5 Industry terminology library
- **PDF:** "WD can build, with the glossary from PPP as the basis"
- **Where we are today:** There's brand-terminology enforcement (`ow/lib/brandscript-voice-enforcement.ts`) that handles trademark first-use and banned words. There is **no** queryable glossary surface yet.
- **Gap to "done":** Build a Glossary entity (term, definition, synonyms, examples, trademark status, banned-replacement-if-any), seed it from PPP glossary, expose it (a) to the agent at retrieval time and (b) as a `/glossary` admin/UI page so you can edit it.
- **Questions for Bill:**
  1. Is the PPP glossary already extracted as a discrete file, or do I need to parse it out of the PPP book `.md`?
     - **Answer (2026-05-11):** The canonical glossary already lives as a discrete artifact on the OpticWise website at https://opticwise-html.onrender.com/glossary/index.html. Bill wants it **parsed out into a structured `.md` file** so the OWnet agent can reference it at retrieval time — explicit goal is to **prevent acronym-soup responses** and ensure every acronym/term gets its canonical definition when used.
     - **Content captured (2026-05-11):** ~60 terms across four sections — *OpticWise Frameworks* (PPP, 5C, 5S, BoT, SIC, Layer 1, Layer 2), *OpticWise Products* (Property Brain, Portfolio Brain, PPP Audit, ElasticISP, 5S Managed Wi-Fi), *Industry Vocabulary / CRE Fundamentals* (AI, API, BAS, BMS, BI, Brownfield, CapEx, CCPA, CRE, Data lake, Data warehouse, DDIA, Digital backbone, GDPR, Greenfield, Hardware, HVAC, IoT, IRR, ISP, KPI, ML, NOI, OpEx, OT, PEDS, ROI, RPA, Smart building, Time-of-use, UX), *Core Concepts* (Owner-controlled data, Owner-controlled digital infrastructure, AI-ready CRE, Vendor lock-in, Property Intelligence Layer, Digital infrastructure (CRE), 5C Plan vs traditional, IT/OT Gap, Trust plane, Data plane, Decision engine, Skybox Principle, Massaged Report, Diligence Discount, Big Three Plays, PPP Review).
     - **Build task implied:** (1) parse the published glossary page into a structured `.md` with one entry per term (fields: term, category, definition, related terms, trademark status); (2) save to canon folder + commit to repo so version control tracks changes; (3) add classifier rule `glossary` → `Canon — Glossary` (priority 1); (4) extend OWnet agent system prompt with a "define-on-first-use" rule that injects the glossary definition the first time an acronym appears in a response.
  2. Beyond IT vs OT terms (covered in 1.6), what categories of terms matter? (Asset-management, building-systems, finance/capital markets, regulatory?)
     - **Answer (2026-05-11):** Extend the glossary across **all four** new categories — **Finance / Capital Markets** (DSCR, LTV, cap rate, NOI multiple, exit cap, refi, lender, LP/GP, etc.), **Regulatory** (SEC cyber disclosure, NIST CSF, CMMC, ISA/IEC 62443, ASHRAE, FCC, BICSI standards), **Building Systems Specifics** (VAV, RTU, chiller plant, EMS, sub-metering, fire/life safety, access control specifics), and **Asset Management** (asset class definitions like multifamily, MTU office, mixed-use, hospitality; portfolio-level concepts like benchmarking, rollups, asset-class playbook). Bill will prune the draft once produced.
     - **Build task implied:** When generating the parsed glossary `.md` (per question 1's build task), include draft entries for the four new categories above. Mark each new entry `status: draft` so Bill's review pass can quickly approve/edit/remove.
  3. Should "banned terms" (ESG, leverage, synergy, etc.) live in the same glossary or stay in code? My recommendation: same glossary, with a `policy` field, so non-engineers can edit.
     - **Answer (2026-05-11):** **Include them in the glossary** (definitions for ESG, PropTech, etc. are useful — people search for them, the agent should be able to explain them). But **restrict their usage** to internal/lookup contexts only. ESG, PropTech, and the other banned terms must NOT appear in:
       - Outbound marketing content (blog posts, LinkedIn posts, email campaigns, ads)
       - Public website copy (opticwise.com, peakpropertyperformance.com, landing pages)
     - They MAY appear in: glossary definitions, internal docs/notes, agent responses to definition/lookup questions, competitive analysis, and meeting transcripts.
     - **Build task implied:** (1) glossary `.md` includes every term with a `usage_policy` field — values like `canonical` (use freely), `restricted_outbound` (define internally but never in marketing/website), `prefer_alternative: "..."` (e.g., ESG → "operations" or "data"), `trademark_first_use` (Property Brain™, BoT®, etc.); (2) the existing `brandscript-voice-enforcement.ts` only fires its banned-word stripping when the output context is tagged `outbound_marketing` or `website_copy` — not for general agent chat, glossary lookup, or internal analysis; (3) add an output-context tag to every agent generation surface (Content Engine, LinkedIn manager, form confirmation emails, etc.) so the enforcer knows when to engage.
- **Effort:** `M`

## 1.6 IT vs OT background for OWbrain
- **PDF:** "see previous slack msg to DD"
- **Questions for Bill:**
  1. Can you paste the Slack message text here (or link it) so we have the authoritative source?
     - **Answer (2026-05-11):** Bill pasted the full 30-Second Explainer in chat. Captured verbatim and saved as the canonical stance doc at `opticwise/canon/IT_vs_OT_stance_v1.md`. Contents: brain-vs-nerves analogy, IT/OT definitions with full example lists, OpticWise POV ("most owners have an IT strategy, almost none have an OT strategy"), the core sales line ("You've got a plan for IT. We help you build a plan for OT…"), three discovery questions, brand tie-in close ("We sit at the intersection of IT and OT…"), and an explicit stance-enforcement section for the OWnet agent.
  2. Is this a single primer doc to ingest, or a stance the agent must always take when IT/OT comes up (i.e., a rule/policy)?
     - **Answer (2026-05-11):** **Active stance/policy.** The OWnet agent must apply this framing **every time** IT, OT, or any OT-adjacent term (BMS, BAS, HVAC controls, access control, submeters, leak detection, cameras, building network, edge controllers) appears in a prompt or response — not just when explicitly asked. Five enforcement rules captured in the canon file: (1) frame OT-first, (2) always pair IT + OT under Owner Data Standard, (3) never describe OW as an "IT company" or an "OT vendor", (4) use the brain-vs-nerves analogy for non-technical owners, (5) drop the core line in any sales-context response.
- **Build task implied:** (1) `opticwise/canon/IT_vs_OT_stance_v1.md` is committed and ready; (2) extend the canon ingester to walk a repo `canon/` folder in addition to the Drive canon folder (so repo-tracked canon flows into retrieval); (3) add a "Domain Stances" section to `ow/lib/brandscript-prompt.ts` that loads this stance when any IT/OT trigger term is detected in the prompt or retrieved context; (4) classifier rule: `it_vs_ot` → `Canon — Domain Stance` (priority 1).
- **Status:** **Source captured + canonical file written.** Implementation is one build task (covered above).
- **Effort:** `S`

## 1.7 Going-forward training workflow ⭐ (this is the big one)
- **PDF:** "How do I train OWnet going forward? I need to be able to train it so team OW acts on what is ingested, not what it hallucinates or draws from conversations alone"
- **Where we are today:** Training is **scripted only** today — devs run `ingest-content-engine-canon.ts` or similar. There's no user-facing "feed this to OWnet" workflow, no feedback loop where wrong answers get corrected, and no per-conversation memory write-back.
- **Gap to "done":** A self-serve training surface with (1) **Ingest** (drop a file or URL → canon), (2) **Correct** (thumbs-down a bad answer + write the right one → it goes into a high-priority "corrections" index), (3) **Audit** (show what canon was retrieved for any given answer — sourcing for trust), (4) **Forget** (remove a doc and re-index).
- **Questions for Bill:**
  1. Who needs to be able to train OWnet? (Just you and Drew? Or whole OW team?) → drives RBAC.
     - **Answer (2026-05-11):** **Bill + Drew only.** Two-trainer model. RBAC scopes: both have full ingest/correct/edit/approve permissions; everyone else on the OW team can read what's been trained but cannot submit training data. (Implies a `role: trainer` flag on the `User` table, gated UI on `/knowledge-base/train`, and any "thumbs-down + write a correction" surface only renders for users with `role.trainer === true`.)
  2. Do you want corrections to be **immediate** (next query uses them) or **reviewed-then-published** (you approve before they're live)?
     - **Answer (2026-05-11):** **Immediate.** Whichever trainer (Bill or Drew) submits a correction, it's live on the next query. Fast feedback loop. Include a "rollback last correction" affordance on the corrections list so a bad one can be reverted with one click.
  3. Should conversation memory be **off by default** (your stated concern is hallucination from chat), with knowledge base being the single source of truth? My strong recommendation: yes, off by default, with a per-conversation "treat this thread as ground truth" toggle.
     - **Answer (2026-05-11):** **Yes — off by default, with a per-thread "treat this thread as ground truth" toggle.** Every agent query draws exclusively from canon + trained corrections; prior conversations do not bleed into other threads. The toggle is the bridge: when Bill or Drew finishes a conversation that produced a great answer or refined a position, they click "save as ground truth" and that thread (or specific turns) joins the canon as a `KnowledgeCorrection` with provenance tagged back to the originating chat. This is the cleanest answer to the hallucination concern from the PDF — team OW acts on what's ingested, not on chat drift.
  4. Do you want a **weekly digest** ("here's what was added/corrected this week, here's what answers it changed")?
     - **Answer (2026-05-11):** **Yes — weekly digest to Bill only.** Monday morning email + Slack DM. Drew can pull the same report on demand from a `/training-digest` page, but is not on the scheduled distribution. Digest contents per spec above: canon adds/edits with diff snippets, correction count + scope, materially changed canonical answers, top 10 queries (canon-hit vs. LLM-fallback breakdown).
- **Recommended approach:** Build `/knowledge-base/train` UI on top of existing `KnowledgeDocument` infra: upload/URL fetch, corrections write to a separate `KnowledgeCorrection` table that gets retrieved with a 2× boost, every agent response gets a "View sources" expandable showing the chunks used. Add `/training-digest` page (pullable by Drew) and a Monday cron that emails+Slack-DMs Bill with the same content.
- **Effort:** `L` (this is its own mini-feature — UI + corrections table + retrieval boost + sources-shown affordance + digest cron)

---

# 2. PPP & OW Websites

## Section 2 — CLOSED (executive call, 2026-05-11)

**Bill's decision (2026-05-11):** Everything relative to both websites (PPP and OW) is considered **done**. No additional scope, verification, or follow-on work required from OWnet for v1.

This applies to all four originally tracked items:

- **2.1 PPP website built new** — done.
- **2.2 AEO (Answer Engine Optimization) — PPP + OW** — done (or out of scope for v1).
- **2.3 Future landing page workflow** — done (or out of scope for v1).
- **2.4 OW website** — done (WD-owned per original PDF; no further action).

If a website-related gap surfaces later, re-open as a new line item. Until then this section is parked.

---

# 3. CRM

## 3.1 Specific deal with broken state — Harlow Spring Cypress (Houston) / Aspen Oak (GHIS)
- **PDF:** "deal has all emails in in. very confusing"
- **Questions for Bill:**
  1. Can you confirm whether the issue is (a) emails showing in the wrong deal, (b) emails duplicated, (c) emails attached but unreadable, or (d) something else?
     - **Answer (2026-05-11):** **(a) Wrong emails showing.** The deal pulls **the entire inbox**, not just the emails associated with the deal's contacts/companies. Reproduced on this exact deal (URL: `https://ownet.opticwise.com/deal/cmouc146f00l5oa2ah68a4l5k`). UI shows `Email Messages: 0` (correct — nothing explicitly linked) yet the Emails tab below renders unrelated emails: Gemini trading promo, CDIA Vegas sponsorship to Charley, PPP Podcast invite to Chad, Realcomm Webinars, etc. None of these touch Aspen Oak or anyone associated with this deal.
  2. Is this still broken **today** in the current build, or was it a snapshot from before the email-linking fixes?
     - **Answer (2026-05-11):** **Still broken today.** Bill created this deal new on 5/6/2026 and the bug is present in the current production build (as of 5/11/2026). Confirmed reproduction at the URL above. Not a stale-state issue — this is a live bug in `app/deal/[id]/page.tsx`.
- **Root-cause diagnosis (2026-05-11):**
  - File: `opticwise/ow/app/deal/[id]/page.tsx` lines 94–124 (the `addressMatched` block).
  - The block matches **any inbox email** whose `from` OR `to` contains the deal's person email OR the deal's organization domain. If the org domain is generic (`opticwise.com`, `gmail.com`, `yahoo.com`, `outlook.com`, etc.) OR the person email is the deal owner's own email (e.g., `bill@opticwise.com`), the OR clause matches half the inbox.
  - Secondary risk: lines 80–92 (`threadLinkedEmails`) join by `subject` only, so threads with short/generic/empty subjects can spuriously match. Currently masked by the bigger bug but will surface after the primary fix.
- **Fix (Sprint 1 — `S` effort):**
  1. **Guard against generic-domain matching.** Skip the `addressMatched` domain branch entirely if `deal.organization.domain` is in a deny-list (`gmail.com`, `yahoo.com`, `hotmail.com`, `outlook.com`, `icloud.com`, `aol.com`, `me.com`, plus the current OW user's own domain `opticwise.com` when that domain matches the logged-in user's email domain — i.e., never address-match on the trainer's own domain).
  2. **Guard against owner=contact.** If `deal.person.email` matches the current logged-in user's email, skip the person-email branch of `addressMatched`. (You should never address-match on yourself.)
  3. **Fix `threadLinkedEmails`.** Require subject to be non-empty AND personId OR syncUserId to be set; never match by subject alone.
  4. **Add UI control.** A "Show inferred matches" toggle (off by default) on the Deal Emails tab so the only thing rendered by default is `directlyLinked` + properly-filtered `threadLinkedEmails`. The inferred-matches view becomes an opt-in widening, not the default.
  5. **Verify on the Harlow/Aspen Oak deal** — the Emails tab should render an empty state until you explicitly link an email or add a properly-scoped contact.
- **Effort:** `S` (single-file change + regression test).

## 3.2 Add companies/contacts inline when creating a deal
- **PDF:** "when creating a new deal I need the ability to add companies and contacts rather than just find them from a very long list"
- **Where we are today:** Existing deal-create UI is a select from existing rows.
- **Gap to "done":** "Create new" affordance inside the picker — same pattern as adding a contact during a meeting-transcript review (mentioned in 5.4 below). One reusable combobox component.
- **Questions for Bill:**
  1. When you create a contact-on-the-fly from inside the deal flow, do you need to land on the contact page after, or just want the deal to save and continue?
     - **Answer (2026-05-11):** **Stay on the deal-create form.** The newly created contact appears as the selected value in the picker; Bill continues building the deal without context-switch. Same for companies.
  2. Same question for company.
     - **Answer (2026-05-11):** **Same — stay on the deal-create form.** Company creation behaves identically to contact creation.
- **Recommended approach:** Build a `<InlineCreatePicker>` component → swap it in everywhere a long-list picker exists today (deals, transcripts, support tickets). On "Create new", open a small modal with the minimum required fields (name + email for contact; name + domain for company). Save creates the record, returns the new ID/label, the modal closes, and the picker shows the new entity as selected. No page navigation.
- **Effort:** `M`

## 3.3 Files on deals
- **PDF:** "Need to be able to add files to deals"
- **Where we are today:** I see `app/deal/`, `app/deals/` routes but no obvious file-upload widget. Need to confirm if there's a `DealFile` table.
- **Questions for Bill:**
  1. Files = uploaded from desktop, or linked from Google Drive, or both? (Strong rec: both — upload for one-offs, Drive link for shared/RBAC'd assets.)
     - **Answer (2026-05-11):** **Both.** Upload from desktop for one-off artifacts (proposals, signed NDAs, term sheets, scans) AND link from Google Drive for shared/RBAC'd assets. The Drive link path preserves the source-of-truth in Drive (versioned, ACL'd) instead of copying.
  2. Max size we should support per file? (10 MB / 100 MB / unlimited?)
     - **Answer (2026-05-11):** **10 MB** per uploaded file. UI displays a clear message: *"For anything bigger, paste a Drive link instead."* Server rejects >10 MB uploads with the same message. Drive-linked files have no size cap (Drive enforces its own).
  3. Should files attached to a deal be **searchable** by the agent (extracted text vectorized into the knowledge base scoped to that deal)?
     - **Answer (2026-05-11):** **Opt-in per file.** Default off. Each attached file shows a "Make this searchable" toggle. When toggled on, the file's text is extracted (PDF/DOCX/TXT; OCR for images optional later) and indexed into a `DealAttachmentChunk` table scoped to that deal — only retrievable when the agent is operating in that deal's context, never in general agent answers. Keeps NDAs / compensation docs / sensitive attachments out of retrieval unless explicitly enabled.
- **Recommended approach:** S3-backed file storage on the deal + a "Link from Drive" button. Per-file `searchable: boolean` flag. When toggled true, async text extraction + chunk write to `DealAttachmentChunk` (deal-scoped retrieval). UI shows extraction status (Pending / Indexed / Failed) so Bill can see what's actually queryable.
- **Effort:** `M`

## 3.4 Edit and add pipelines + MTU Tenant Pipeline missing
- **PDF:** "Need the ability to edit and add pipelines" and "There is no 'MTU Tenant Pipeline'. There's only one pipeline and nothing changes when I click the pipeline differentiators buttons to the right of 'Deals' text"
- **Status (2026-05-11):** **CLOSED — corrected separately by Danny.** Pipeline CRUD, the deals-page filter, and the missing MTU Tenant Pipeline are all resolved outside this punch list. No further action required from this scope.

## 3.5 Emails linked to deal don't actually show in the deal
- **PDF:** "ref: Oakiq: Copper Creek (Lenexa, KS) deal and emails to/from Aaron Leatherdale"
- **Where we are today:** Email→deal linking exists, but per the PDF: "the email shows as linked but it's not in the deal." This is a real bug.
- **Gap to "done":** Reproduce on the named deal, fix the read query (likely a join or filter mismatch between `email_link` and the deal-detail email list).
- **Questions for Bill:**
  1. Is this still broken today, or fixed by the recent email-linking updates? (I'll verify on the named deal regardless.)
     - **Answer (2026-05-11):** **Likely already resolved.** Verification still needed — when the Sprint 1 work picks this up, the first step is to load the Oakiq / Copper Creek (Lenexa, KS) deal with Aaron Leatherdale's emails and confirm the explicitly-linked emails render correctly. If they do, this item closes. If not, the fix is a join/filter mismatch in `directlyLinked` and we patch it during the same Sprint 1 pass that addresses 3.1.
  2. Do you want a "Sync emails from inbox into this deal" button on the deal page, or should it stay automatic?
     - **Answer (2026-05-11):** **Fully automatic.** No manual "sync" button. Email→deal linking should happen on its own — when an email arrives whose `from`/`to` matches a deal's person or properly-scoped org domain (per the deal-side guards added in the 3.1 fix), it's auto-linked. No human-in-the-loop required.
- **Recommended approach:** During the Sprint 1 pass on 3.1, also (a) verify Copper Creek / Aaron Leatherdale linked emails render, (b) confirm the auto-link writer is firing on inbound mail, (c) write a regression test that creates a fake email + linked deal and asserts the email appears in `directlyLinked` for the deal-detail render.
- **Effort:** `S` (mostly verification + regression test; fix-if-needed scoped tight).

## 3.6 Contact list (company-wide) — currently being tested
- **PDF:** "currently being tested"
- **Questions for Bill:**
  1. Anything broken you've found during testing? List it here and I'll batch-fix.

---

# 4. Integrations

## 4.1 QuickBooks
- **PDF:** "push this per WD" → **Deferred.** No action.

## 4.2 Google Docs accessible to OWnet agent
- **PDF:** "may need some RBAC here… can this just use what they have access to already in google drive? WD built the above RBAC matrix in message to Danny Mar 3."
- **Where we are today:** Drive integration exists (MCP bridge live per 2026-05-08). RBAC enforcement on what the agent surfaces per user — unclear if implemented.
- **Gap to "done":** Per-user Drive access: when User X queries OWnet, the retrieval layer only returns chunks from docs **User X has access to in Drive**, using their OAuth token rather than a shared service account.
- **Questions for Bill:**
  1. Can you re-paste (or link) the RBAC matrix from your March 3 message to Danny so I have it as the spec?
  2. Today the Drive integration uses a service account. Are you OK switching to **per-user OAuth** so RBAC is real? (Cost: each user has to authorize Drive once.)
  3. For users without Drive access at all (e.g., a contractor), should they see "0 results" or "you don't have access to OWnet's Drive corpus, talk to admin"?
- **Recommended approach:** Migrate Drive auth to per-user OAuth → at retrieval time, filter results by `userHasAccess(userId, driveFileId)` (cached) → fall back to public canon for unauthenticated/non-drive users.
- **Effort:** `L`

## 4.3 Slack — intelligent AI chat & assistance
- **Where we are today:** Slack bot deployed (per recent updates), MCP Slack is configured but disabled pending the `users:read` / `channels:read` / `channels:history` scopes.
- **Gap to "done":** Add the missing Slack scopes (2-minute change), then verify intelligent assistance works in DMs and threads.
- **Questions for Bill:**
  1. Who has admin on the OW Slack workspace to add the scopes? (You, Roxana, Danny?)
  2. Do you want the bot to respond in every channel or only when @-mentioned?
  3. Should the bot **write to Slack** (post summaries, action items) or only **answer questions**?
- **Effort:** `S`

## 4.4 Gmail
- **Status:** Live for forms, password reset, owner notifications, etc.
- **Action:** Confirm any specific Gmail integration gaps you have in mind beyond what's wired.

## 4.5 Calendly
- **PDF:** "push this per WD" → **Deferred.** No action.

## 4.6 Chatbot integrations
- **PDF:** "need tighter definitions here"
- **Questions for Bill:**
  1. Which chatbot do you mean — the website chatbot (Intercom-style live chat) or LLM chatbots (ChatGPT, Claude) integrating with OWnet?
  2. If website chatbot: which sites (PPP, OW), which pages, and what should it do — answer Q&A from canon, capture leads into CRM, or both?
  3. If LLM integrations: are you asking for OWnet to be **callable from** ChatGPT (as an action/tool) or for OWnet to **embed** an LLM widget?
- **Effort:** Depends entirely on (1).

## 4.7 Call recorder (Read.ai / Fathom)
- **Where we are today:** Fathom integration is live — meetings, transcripts, summaries, action items are in OWnet. Read.ai is mentioned in the PDF; need to confirm which we're standardizing on.
- **PDF sub-items:**
  - "How can I use OWnet to generate emails/etc from transcripts?"
  - "How to classify each meeting so OWnet digests accordingly?"
  - "On the transcripts, need the ability to add new contacts in CRM. It only allows selection of existing and the list is crazy long."
- **Gap to "done":** Three discrete features:
  1. **Generate-from-transcript** button on every meeting → "Draft follow-up email", "Draft proposal outline", "Draft LinkedIn DM" — uses Bill's voice canon.
  2. **Meeting classifier** that auto-tags every meeting (Sales discovery / Sales demo / Client check-in / Internal / Vendor / Recruiting) and only sales calls feed back into agent training as prospect/client knowledge.
  3. **Inline contact creator** on transcript page (same component as 3.2).
- **Questions for Bill:**
  1. Are we standardizing on **Fathom** (already wired) or **Read.ai** (in the PDF)? If we keep both, which is primary?
  2. For the classifier — give me your taxonomy. Draft: Sales-Discovery, Sales-Demo, Sales-Proposal-Review, Client-Check-In, Client-QBR, Internal-Standup, Internal-Strategy, Vendor, Recruiting, Personal. Add/remove as you see fit.
  3. For training: should **only Sales-Discovery + Sales-Demo + Client-** classes feed back into prospect/client knowledge, with everything else excluded? (My default.)
  4. For the "Draft email from transcript" feature, which standard outputs do you want as one-click buttons? (Follow-up, proposal outline, recap-to-team, LinkedIn DM, anything else?)
- **Recommended approach:** Build the classifier first (it gates what training data flows through), then the generate-from-transcript actions, then port the inline contact creator from 3.2.
- **Effort:** `M`

## 4.8 ElevenLabs (subscribed, not enabled)
- **PDF:** "need to be enabled/integrated/operational"
- **Questions for Bill:**
  1. What's the use case — voice cloning (your voice on a callback, podcast intro, demo narration), TTS for the support agent, both?
  2. Which voices need to exist — yours, Drew's, a "neutral OW brand" voice?
- **Recommended approach:** Clone the requested voices → expose a `/voice` tool in the agent (`Generate audio of <text> in <voice>`) → wire into specific surfaces (T1 support callback, Content Engine deliverables).
- **Effort:** `M`

## 4.9 Twilio (subscribed, not enabled)
- **PDF:** "need to be enabled/integrated/operational"
- **Questions for Bill:**
  1. Use cases: outbound SMS to leads (and which lifecycle stage triggers it), inbound voice number, two-way messaging in the CRM, all of the above?
  2. Compliance: do you want consent capture wired into every form that opts a lead in for SMS? (Required for 10DLC.)
- **Recommended approach:** Phase 1 — set up the number(s) and 10DLC, build inbound SMS → CRM activity. Phase 2 — outbound SMS as a deal action. Phase 3 — voice (if needed).
- **Effort:** `L` (10DLC alone is multi-week elapsed time, even though work is small)

## 4.10 LinkedIn automation — responses, comments, inbound leads
- **Where we are today:** LinkedIn Manager is launched (per recent updates) — handles outbound DMs/posts. Inbound automation (replies to comments, auto-responses) and inbound-lead routing into CRM — status uncertain.
- **Questions for Bill:**
  1. For inbound comment replies: do you want **draft-then-approve** (recommended given LinkedIn ToS sensitivity) or **fully automated**?
  2. For inbound leads (someone DMs you cold): should they automatically become a Contact + Deal in the *LinkedIn Inbound* stage?
  3. Which LinkedIn profiles are in scope? (You, Drew, PPP company page, OW company page.)
- **Effort:** `M`

## 4.11 Lead scoring & qualifying — pre and post call
- **PDF:** "enable this capability"
- **Where we are today:** Nothing explicit. We have all the inputs (firmographics from companies, engagement from emails, transcripts).
- **Gap to "done":** A `LeadScore` field on Contact and Deal, recalculated on (1) form submission, (2) email engagement, (3) call recording arrival.
- **Questions for Bill:**
  1. What's the **scorecard**? Draft based on what I know about OW:
     - Portfolio size ≥ 1,000 units: +30
     - Multifamily or MTU: +20 (else +5)
     - Asset manager / capital allocator title: +20 (else owner/operator +15, on-site +5)
     - Has had ≥ 1 sales call: +15
     - Mentioned "data infrastructure" / "AI" / "tenant experience" in call: +10
  2. Above what score is a lead "qualified" → moves stage automatically?
  3. Should low-score leads be auto-nurture (added to a sequence) or auto-archive?
- **Effort:** `M`

## 4.12 Tier-1 support agent (replacing OW team)
- **PDF:** "Per Danny offer in Feb… ticket history and emails sent to Danny in Slack last month… OW is pulling T1 agent call transcripts from last 30 days"
- **Where we are today:** `app/support-agent/` and `app/api/support/` routes exist. Unclear whether it's a chat surface only, or also handles inbound email + call.
- **Gap to "done":** A T1 agent that can (1) answer 80% of support questions from the canon + ticket history, (2) escalate to a human with full context, (3) be reached via every channel the OW customers actually use (email, chat widget on customer portal, phone if Twilio comes in).
- **Questions for Bill:**
  1. Which customers are in scope for T1 — all paying customers, only specific properties, free trial users?
  2. What channels must T1 cover? (Email to a support address, live chat on a portal, SMS, voice?)
  3. Has Danny shared the ticket history + call transcripts referenced in the PDF? If yes, where? If no, we need them as the training corpus.
  4. Hand-off criteria: when must the agent escalate? (Examples: outage report, billing dispute, security question, anything containing keyword "lawyer".)
  5. Who does it escalate **to**?
- **Effort:** `L`

## 4.13 Social posting tool (replace Hootsuite)
- **PDF:** "in original SOW… need ability for Roxana to post to 4 different LI profiles - Drew, Bill, PPP OW"
- **Where we are today:** LinkedIn Manager exists. Multi-account posting + scheduling unclear.
- **Gap to "done":** A "Social Composer" page where Roxana can: pick **target accounts** (multi-select from Drew/Bill/PPP/OW), write/upload media, schedule, optionally generate from Content Engine output, see a calendar view, see analytics. Out of scope until you confirm: X (Twitter), Threads, Bluesky.
- **Questions for Bill:**
  1. Confirm the 4 accounts: **Drew's personal LI, Bill's personal LI, PPP company page, OW company page**. Anything else (X, Threads, Instagram for PPP brand)?
  2. Approval workflow — Roxana drafts → you approve → it posts? Or Roxana has full publish authority?
  3. Should the Content Engine's weekly LinkedIn deliverables auto-populate the scheduler as drafts each Monday?
- **Recommended approach:** Build on top of an existing API (Buffer API, or direct LinkedIn API + per-account OAuth). The scheduler + composer UI is the real work.
- **Effort:** `L`

---

# 5. Lead Magnets

## 5.1 Calculator
- **PDF:** "ditch this. I'd much rather do the next one instead, plus I build a Property Brain Score that will be better than the one I sent you for this last month."
- **Status:** **Killed by Bill.** No action.

## 5.2 Digital book shipping (currently broken)
- **PDF:** "This needs to work. It currently does not."
- **Where we are today:** `app/book-request/` exists, lead magnet UI in place. Need to reproduce the break.
- **Questions for Bill:**
  1. What exactly breaks — submission errors, no email sent, wrong file in email, email goes to spam, lead doesn't reach CRM?
  2. Latest test: which URL did you submit, what email did you use, what should I see in the CRM that I don't?
- **Recommended approach:** Reproduce → fix → add a synthetic-test cron that submits a test entry every 24 hours so it never silently breaks again.
- **Effort:** `S`

## 5.3 Physical book shipping
- **PDF:** "Can we build physical book shipping model please? per original conversations… although Danny promised this in this phase, I am willing to put this off and consider that a future project"
- **Status:** Bill flagged as **future project**. Track here, don't ship in v1.
- **Effort:** `L` (when scheduled)

## 5.4 Property Brain Score (NEW lead magnet, replacing 5.1)
- **PDF:** "I build a Property Brain Score that will be better than the one I sent you for this last month"
- **Questions for Bill:**
  1. Send me the latest draft of the Property Brain Score model — inputs (form fields), scoring math, output ranges, and the brand/marketing wrap (what the user sees after they get their score).
  2. Should it be **gated** (email required to see score) or **ungated** (score visible inline, with a deeper report behind email)? Recommendation: ungated score, gated report — best conversion + best AEO surface.
  3. Where does it live — a new page on OW, a new page on PPP, or both?
  4. After they submit, what's the follow-up sequence — confirmation email, automatic call booking link, sales sequence?
- **Effort:** `M`

---

# 6. Architecture & Documentation
- **PDF:** Two lines, no detail.
- **Questions for Bill:**
  1. What docs do you need? Options: (a) system architecture diagram for OWnet for your reference / future contractors, (b) runbook for ops (what to do when X breaks), (c) data model reference (what tables exist, what they mean), (d) all of the above?
  2. Audience — you only, future Drew, future contractors, or all?
  3. Where do they live — Notion, Drive, in-repo `/docs`? Recommendation: in-repo `/docs` so they version with the code, with a Drive mirror for non-technical readers.
- **Effort:** `M`

---

# 7. Training (how OW team uses OWnet)
- **PDF:** One line, no detail.
- **Questions for Bill:**
  1. Who needs training — you, Drew, Roxana, Danny's team, all of OW?
  2. Format — recorded Loom walkthroughs (rewatchable), live sessions, written quick-starts, all three?
  3. Which surfaces must be covered minimum: CRM (deals, contacts), Forms admin, OWnet agent, Content Engine, Knowledge Base training (per 1.7), LinkedIn manager, support agent?
  4. Acceptable to record the training sessions and let OWnet itself ingest the transcripts so it can answer "how do I do X in OWnet" going forward? (Big multiplier for low effort.)
- **Effort:** `M`

---

# Global / Cross-cutting Questions
These don't belong to a single item but affect several.

1. **Priority order** — given the sequence I propose below, what's your gut reaction? Anything I have too low that's actually urgent? Anything I have too high that can wait?
2. **What's the v1 ship deadline?** A specific calendar date helps me triage M/L items that could be phased.
3. **Who else is contributing code besides me?** (Danny's team, anyone at nBrain?) → affects how I structure PRs, branches, and review.
4. **Render-only?** All of this assumes the platform stays on Render with the existing Postgres. Any platform changes coming I should design for?
5. **Budget for external services** — ElevenLabs + Twilio + LinkedIn API access have real monthly costs. Is there a ceiling per service?
6. **Failure mode preference** — if I find something broken outside the punch-list while working on a punch-list item, do you want me to **fix it inline** (faster, but scope creeps) or **log it and ship the original scope** (slower, but predictable)?
7. **WD pronouns in the PDF** — to confirm: "WD" = Bill Douglas (you), "DH/DD" = Danny? I want to make sure I'm attributing decisions correctly.

---

# Recommended Sequence

Bucket order is **dependency-first, then pain × ease**. We don't have to follow this strictly — once you answer the questions we can re-sort.

### Sprint 1 — Stop the bleeding (1 week)
1. **3.5** Email-linked-to-deal not showing — bug fix
2. **3.4** Pipeline edit/add + MTU Tenant Pipeline + broken deals-page filter
3. **3.1** Harlow / Aspen Oak deal cleanup (probably resolves with 3.5)
4. **5.2** Digital book shipping fix
5. **4.3** Slack scopes added → AI Slack assistance fully live
6. **2.1** PPP forms sweep — verify every CTA wired (likely done, verify)

### Sprint 2 — CRM completeness (1–2 weeks)
1. **3.2** Inline create company/contact (build reusable `<InlineCreatePicker>`)
2. **3.3** Files on deals
3. **4.7** Call-recorder: classifier + generate-from-transcript + inline contact creator (reuses 3.2's component)
4. **3.6** Contact list — fix whatever testing surfaced

### Sprint 3 — Training & knowledge (1–2 weeks)
1. **1.7** Going-forward training workflow (the self-serve "feed OWnet" surface) — this is the strategic centerpiece
2. **1.1** PPP book ingestion verify + reweight
3. **1.4** OW market research import
4. **1.5** Industry terminology library
5. **1.6** IT vs OT primer
6. **1.3** Marketing GPT + Sales GPT rebuild
7. **1.2** WD/DH digital twins — voice is done; decide if behavioral twin is in scope

### Sprint 4 — Lead engine (1–2 weeks)
1. **5.4** Property Brain Score lead magnet
2. **4.11** Lead scoring & qualifying
3. **4.10** LinkedIn inbound automation
4. **2.2** AEO — `llms.txt` + schema + 25-query monitor
5. **2.3** Future landing page workflow

### Sprint 5 — Customer-facing scale-out (2–4 weeks)
1. **4.12** T1 support agent
2. **4.13** Social posting tool (Hootsuite replacement)
3. **4.8** ElevenLabs voice
4. **4.9** Twilio + 10DLC

### Sprint 6 — Hardening & handoff (1 week)
1. **6** Architecture & documentation
2. **7** Training materials for OW team (recorded + ingested)
3. **4.2** Google Drive RBAC migration (per-user OAuth)

### Deferred (not in v1 by Bill's call)
- **4.1** QuickBooks
- **4.5** Calendly
- **5.1** Calculator (killed)
- **5.3** Physical book shipping (future)

---

# How to fill this in

For each "Questions for Bill" block, drop your answers **directly under the questions** in the same file. I'll re-read this doc at the start of every working session, pick the next sprint item with a complete answer block, and ship it.

If a question is "I don't know yet, let's figure it out together" — write that. We'll add it to a "discuss live" running list.
