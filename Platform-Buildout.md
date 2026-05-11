# Opticwise Platform Buildout

## Repository & Deployment
- **Repo**: https://github.com/nbrain-team/opticwise
- **Platform**: Render (web service)
- **Render Workspace**: OpticWise's workspace (`tea-d4ahvl3ipnbc73aam4o0`, owner bill@opticwise.com), created Nov 2025
- **Render Region**: All services in **Oregon**
- **Main App**: `/ow` — Next.js 15 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Custom JWT (httpOnly cookie `ow_auth`, HS256, 7-day expiry)

### Render Services
- `opticwise-frontend` (`srv-d69lnrmsb7us73ctuvi0`) — main `/ow` Next.js app, starter plan
- `Opticwise-Backend` (`srv-d4ecr5rgk3sc73blsjag`) — `/ow` Next.js, standard plan
- `opticwise-payload` (`srv-d7fbravaqgkc739n6aqg`) — Payload CMS, standard plan
- `opticwise-payload-92pd` (`srv-d7fbu0l7vvec73a9fbd0`) — Payload CMS, starter plan
- `opticwise-email-sync` (`crn-d6c9sv3h46gs738e4isg`) — cron, every 15 min, calls `/api/sales-inbox/sync`

### Render Outbound IP Whitelisting
When a third party API requires whitelisting Render's outbound IPs:
- Render does **not** publish IP ranges publicly — they must be pulled from the Render Dashboard.
- Outbound IPs are **shared across all services in the same region**, so any one Oregon service gives the full list.
- Steps: Render Dashboard → open any Oregon service (e.g. `opticwise-frontend`) → **Connect** dropdown (top right) → **Outbound** tab → copy the CIDR list.
- Direct dashboard URL: https://dashboard.render.com/web/srv-d69lnrmsb7us73ctuvi0
- Render migrated to new outbound IP ranges on **Nov 13, 2025** — old/cached IPs from before that date are retired and should not be used.
- Workspaces created before Jan 23, 2022 don't get fixed Oregon IPs (does NOT apply here — our workspace was created Nov 2025).

## Environment Variables (Required on Render)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | JWT signing secret |
| `OPENAI_API_KEY` | OpenAI embeddings & AI features |
| `ANTHROPIC_API_KEY` | Claude AI for OWnet agent, LinkedIn AI |
| `PINECONE_API_KEY` | Vector search index |
| `PINECONE_INDEX_NAME` | Default: `opticwise-transcripts` |
| `ZERNIO_API_KEY` | Zernio social media API (LinkedIn management) |
| `NEXT_PUBLIC_BASE_URL` | Public app URL |
| `GOOGLE_CLIENT_ID` | Google workspace integration |
| `GOOGLE_CLIENT_SECRET` | Google workspace integration |
| `SLACK_BOT_TOKEN` | Slack bot integration |
| `SLACK_SIGNING_SECRET` | Slack webhook verification |

## Key Modules

### CRM Core
- **Deals/Pipeline**: Kanban board with drag-and-drop
- **Contacts/People**: Full contact management with LinkedIn profiles
- **Organizations**: Company records with address details
- **Campaigns**: Multi-channel marketing automation
- **Conferences**: Event-based lead tracking

### AI & Knowledge
- **OWnet Agent**: Claude-powered AI assistant with RAG
- **Knowledge Base**: Document upload with vectorization
- **Hybrid Search**: Semantic + keyword search via Pinecone + PostgreSQL

### Integrations
- **Google Workspace**: Gmail, Calendar, Drive sync
- **Slack**: Bot integration for notifications
- **Fathom/ReadAI**: Meeting transcript ingestion
- **Zernio API**: LinkedIn social media management

### LinkedIn Social Media Manager (Added 2026-03-31)
- **Zernio Profile ID**: `69bb2d0d20f73b40cbbdf601` (Default Profile)
- **API Base**: `https://zernio.com/api/v1`
- **Features**: Post composer with AI, content calendar, comment management, analytics
- **Database Models**: `LinkedInAccount`, `SocialPost`, `PostComment`
- **API Routes**: `/api/linkedin/*` (connect, accounts, posts, ai, analytics, media)
- **UI Pages**: `/linkedin` (dashboard), `/linkedin/compose`, `/linkedin/calendar`, `/linkedin/posts`, `/linkedin/analytics`
- **AI System Prompt**: Writes in Bill Demas's voice, Opticwise brand, smart building tech industry

### Payload CMS Website (Replacing Ghost CMS — Added 2026-04-14)
- **Directory**: `/payload` — Next.js 15 + Payload CMS 3.x (unified app)
- **Admin Panel**: `/admin` route within the Payload app
- **Architecture**: Payload CMS runs inside Next.js (no separate CMS server)
- **Database**: PostgreSQL via `@payloadcms/db-postgres`
- **Rich Text**: Lexical editor via `@payloadcms/richtext-lexical`
- **SEO**: `@payloadcms/plugin-seo` for pages and posts
- **Collections**: `Pages` (block-based layout builder), `Posts` (blog/insights), `Media` (image uploads), `Categories`, `Users`
- **Layout Blocks**: Hero, Content, Card Grid, CTA, Two-Layer Model, Lead Magnet, FAQ, Timeline, Deliverables
- **Globals**: `SiteSettings` (branding, CTA defaults), `Navigation` (header/footer links)
- **Frontend Routes**: `/(frontend)/(main)/` — home, insights, `[...slug]` catch-all for CMS pages
- **Content Styling**: `.rich-content` and `.ghost-content` classes preserve existing design
- **Seed Scripts**: `scripts/seed-via-api.mjs` (content), `scripts/seed-full.mjs` (images + page blocks)
- **Media Library**: 10 images uploaded (hero, projects, logos, book cover) — managed via admin panel
- **Access Control**: Public read access on Pages, Posts, Categories, Media; write requires authentication
- **Env Vars**: `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_OW_API_URL`
- **Deploy**: Render web service with PostgreSQL (replaces Ghost + MySQL stack)
- **Production URL**: https://opticwise-payload.onrender.com
- **Admin Panel**: https://opticwise-payload.onrender.com/admin

### Ghost CMS (ARCHIVED — Sunset 2026-04-14)
- **Status**: Replaced by Payload CMS. Ghost CMS services can be shut down.
- **Ghost Admin**: `https://opticwise-ghost.onrender.com/ghost/` (deprecated)
- **Ghost Content API**: `https://opticwise-ghost.onrender.com` (deprecated)
- **Old Website**: `https://opticwise-website-v3.onrender.com` (`website-v3-nextjs/`)
- **Archive**: `ghost-cms/` directory retained for reference

### Form Builder (Forms → CRM Bridge)
- **UI Pages**: `/forms` (list), `/forms/new` (create), `/forms/[id]` (edit), `/forms/[id]/submissions` (submissions log)
- **Editor Component**: `app/forms/FormEditor.tsx` (sections: Basics, Routing & Deal, Fields, Submission Experience, **Confirmation Email**, Embed)
- **API Routes**: `/api/forms` (list/create), `/api/forms/[id]` (read/update/deactivate), `/api/forms/[id]/submissions`, `/api/forms/lookups`, `/api/public/forms/[slug]` (public read), `/api/public/forms/[slug]/submit` (public submit)
- **Submission processing**: `lib/forms.ts` → upserts Organization → upserts Person → creates Deal → adds DealContact stakeholder → emails owner (best-effort) → emails submitter (if confirmation enabled)
- **Confirmation Email (Added 2026-05-08)**: Per-form opt-in. Authored in a built-in WYSIWYG editor (`app/forms/RichTextEmailEditor.tsx`) with merge tags from any submission field. Sent FROM `bill@opticwise.com` via the existing Gmail service account in `lib/email.ts`. Display name + reply-to configurable per form. Migration: `20260508140000_add_form_confirmation_email`. New columns on `Form`: `confirmationEmailEnabled`, `confirmationEmailSubject`, `confirmationEmailFromName`, `confirmationEmailReplyTo`, `confirmationEmailHtml`.
- **Email sending**: `lib/email.ts` `sendEmail()` — supports optional `fromName` (display name) and `replyTo` headers. From address is always `bill@opticwise.com` (the impersonated service account).
- **Spam protection**: Per-form configurable honeypot field name; submissions with non-empty honeypot are stored with `status='spam'` and bots receive a normal success response.
- **HTML Embed (Added 2026-05-11 — supersedes Payload `FormEmbed`)**: Standalone vanilla-JS loader served at `https://ownet.opticwise.com/forms/embed.js` (file: `ow/public/forms/embed.js`). Drop-in two-line integration: `<div data-opticwise-form="slug"></div>` + `<script src="…/forms/embed.js" defer></script>`. Auto-mounts every `[data-opticwise-form]` on the page. Optional `data-theme` / `data-align` / `data-eyebrow` / `data-heading` / `data-description` / `data-show-header` attributes. CSS scoped under `.ow-form-embed`, inherits host font. Captures referrer + UTM at submit time. Fires `opticwise:form:submitted` CustomEvent for analytics. Public API exposed as `window.OpticWiseForms.{ mount, mountAll, platformUrl }`.
- **CORS allowlist**: `lib/cors.ts` — defaults to `opticwise.com` + `www.opticwise.com` + `*.vercel.app`. Override via `MARKETING_SITE_ORIGINS` env var (comma-separated absolute URLs).
- **Payload `FormEmbed` (deprecated)**: `payload/src/components/FormEmbed.tsx` and `payload/src/blocks/FormEmbed.ts` are no longer used. The Payload directory is being sunset; new pages should use the HTML embed loader above.

### Customer Service Agent (Added 2026-04-15)
- **Purpose**: Autonomous Tier 1 support agent trained on real support data
- **Data Sources**: 4,250 support emails (mbox) + 89 call transcripts
- **Vector Store**: Pinecone namespace `support-agent` (same index as transcripts)
- **AI Model**: Claude Sonnet 4 for response generation, OpenAI `text-embedding-3-large` for embeddings
- **System Prompt**: `lib/support-agent-prompt.ts` — Tone of voice, issue taxonomy, identity verification, FCR optimization, escalation protocols
- **API Routes**: `/api/support/chat`, `/api/support/sessions`, `/api/support/sessions/[id]`, `/api/support/feedback`
- **UI Page**: `/support-agent` — Customer-facing chat interface with quick actions, conversation history, feedback
- **Database Tables**: `SupportChatSession`, `SupportChatMessage`, `SupportTicket`, `SupportFeedback`, `SupportIngestionLog`
- **Migration**: `prisma/migrations/020_support_agent_tables.sql`
- **Data Ingestion**: `scripts/ingest-support-data.ts` (run via `npm run support:ingest`)
- **Issue Categories**: Connectivity (40%), Credentials (20%), Device Setup (15%), Guest Network (10%), Outages (8%), Billing (7%)
- **Key Features**: RAG from historical support data, auto-identity extraction, intent classification, session management, feedback loop

## Database Schema Highlights
- 30+ models in Prisma schema
- Migrations managed via `prisma migrate deploy` (runs during build)
- Latest migration: `20260331000000_add_linkedin_social_media`
