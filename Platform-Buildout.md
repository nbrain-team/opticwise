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

### Ghost CMS Full Page Management (Added 2026-03-31)
- **Ghost Admin**: `https://opticwise-ghost.onrender.com/ghost/`
- **Ghost Content API**: `https://opticwise-ghost.onrender.com` (key: `fd55f30a689a1212fb14ab2ab1`)
- **Website**: `https://opticwise-website-v3.onrender.com` (`website-v3-nextjs/`)
- **Architecture**: Headless CMS — Ghost provides content, Next.js renders pages
- **Dynamic Route**: `website-v3-nextjs/app/(main)/[...slug]/page.tsx` — catch-all for Ghost pages
- **Ghost API Client**: `website-v3-nextjs/lib/ghost.ts` — `getAllPages()`, `getPageBySlug()`, `getAllPosts()`, `getPostBySlug()`
- **ISR Revalidation**: Webhook at `/api/revalidate` + 5-minute time-based revalidation
- **Content Styling**: `.ghost-content` in `globals.css` — handles all Ghost card types
- **Migration Script**: `ghost-cms/create-pages.js` — bulk-creates pages via Ghost Admin API
- **Special Pages** (kept as hardcoded routes): FAQ (interactive tabs), schedule-review (form), cre-ai-readiness (redirect)
- **Image Storage**: Ghost persistent disk at `/var/lib/ghost/content` (1GB on Render)
- **Ghost Version**: 5.x (Alpine Docker image)

## Database Schema Highlights
- 30+ models in Prisma schema
- Migrations managed via `prisma migrate deploy` (runs during build)
- Latest migration: `20260331000000_add_linkedin_social_media`
