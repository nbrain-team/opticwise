# Opticwise Platform Buildout

## Repository & Deployment
- **Repo**: https://github.com/nbrain-team/opticwise
- **Platform**: Render (web service)
- **Main App**: `/ow` — Next.js 15 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Custom JWT (httpOnly cookie `ow_auth`, HS256, 7-day expiry)

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

## Database Schema Highlights
- 30+ models in Prisma schema
- Migrations managed via `prisma migrate deploy` (runs during build)
- Latest migration: `20260331000000_add_linkedin_social_media`
