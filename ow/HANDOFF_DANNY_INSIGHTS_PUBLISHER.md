# Handoff: OWnet Insights Publisher (Danny)

**Purpose:** Finish shipping the Insights authoring flow so editors can draft in OWnet, optionally schedule, and **publish to `nbrain-team/opticwise-html` via GitHub** (Render static site redeploys on `main`).

**Repo / branch:** OpticWise app — `opticwise` monorepo, work under **`ow/`** (Next.js OWnet).

**Primary doc:** [`ow/DEPLOYMENT_INSIGHTS.md`](DEPLOYMENT_INSIGHTS.md) (env vars + cron summary).

---

## What’s already implemented (no code needed for v1)

| Area | Location |
|------|----------|
| Prisma: `Insight`, `InsightAsset`, enums | `ow/prisma/schema.prisma` |
| Migration | `ow/prisma/migrations/20260512120000_add_insights_publisher/migration.sql` |
| Auth: `admin` + `editor` | `ow/lib/require-editor.ts`; `User.role` includes `editor` |
| UI: list, new, editor, preview | `ow/app/insights/**` |
| APIs | `ow/app/api/insights/**` |
| Publish pipeline (HTML + images + listing + search-index + sitemap + RSS) | `ow/lib/insights/publish.ts`, `github-push.ts`, `render-post-html.ts`, `index-builder.ts`, `sitemap-rss.ts` |
| Scheduled publish cron entrypoint | `GET`/`POST` `ow/app/api/insights/cron/publish-due/route.ts` |
| Rich text (images, Word import) | `ow/app/forms/RichTextEmailEditor.tsx`, import + assets routes |

---

## Your checklist (do in order)

### 1. Dependencies & Prisma client (local or CI sanity)

From repo root:

```bash
cd ow
npm install
npx prisma generate
```

### 2. Apply database migration (production OWnet Postgres)

**Requires `DATABASE_URL`** pointing at the OWnet app database (same as Render).

```bash
cd ow
npx prisma migrate deploy
```

Confirm migration `20260512120000_add_insights_publisher` is applied.

### 3. GitHub → opticwise-html

- Create or use a **fine-grained PAT** or **GitHub App** token with **`contents: write`** on **`nbrain-team/opticwise-html`**, branch **`main`**.
- Add to the **OWnet** Render web service as:

  | Env var | Value |
  |---------|--------|
  | `GITHUB_TOKEN` | *(secret)* |
  | `INSIGHTS_REPO_OWNER` | `nbrain-team` *(optional if default)* |
  | `INSIGHTS_REPO_NAME` | `opticwise-html` *(optional)* |
  | `INSIGHTS_REPO_BRANCH` | `main` *(optional)* |

### 4. Scheduled posts — cron secret + Render Cron Job

1. Generate a long random string → **`INSIGHTS_CRON_SECRET`** on the OWnet service.
2. In **Render**, add a **Cron Job** (suggested: every **5 minutes**):
   - **Request:** `GET` or `POST`  
     `https://ownet.opticwise.com/api/insights/cron/publish-due`
   - **Auth:** header  
     `Authorization: Bearer <INSIGHTS_CRON_SECRET>`  
     *(or query `?secret=<INSIGHTS_CRON_SECRET>` if header not supported)*

Without this, **“Save as scheduled”** writes DB rows but nothing promotes them to git.

### 5. Optional: absolute asset URLs in editor HTML

If inline image URLs in the editor must rewrite correctly when the browser uses a full OWnet origin:

| Env var | Example |
|---------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://ownet.opticwise.com` |

### 6. Editor users (e.g. Roxana)

- **`editor`** role can use `/insights` (see `ow/app/insights/layout.tsx` and `require-editor`).
- **Admins** can create users with `"role": "editor"` via existing `POST /api/users` body, or patch an existing user’s role in admin UI/API.

### 7. Deploy OWnet

Redeploy the OWnet service after env vars and migration so production matches this branch.

---

## Quick verification (smoke)

1. Log in as an **`editor`** user.
2. Open **More → Insights** (nav loads role from `/api/auth/me`).
3. **New insight** → set real **slug** (lowercase, hyphens; not only `draft-…` if you want clean URLs).
4. **Category**, **body**, **hero image** upload (required for publish).
5. **Publish now** → confirm:
   - Commit on `opticwise-html` `main` (message like `insight: publish "…" (slug)`).
   - Render static deploy runs.
   - `https://www.opticwise.com/insights/<slug>/` works after CDN refresh.
6. Optional: **schedule** a post a few minutes out → wait for cron → same checks.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Publish returns 500 / “GITHUB_TOKEN” | Token missing or `contents:write` / wrong repo |
| Publish OK but listing/search wrong | Rare: bad fetch of `insights/index.html` / `search-index.json` from GitHub; check token can **read** those paths |
| Scheduled never goes live | Cron not created, wrong URL, or `INSIGHTS_CRON_SECRET` mismatch |
| 403 on `/insights` | User not `admin` or `editor` |
| Hero required error | No asset with `kind` **hero** — use **Upload hero image** on the editor |

---

## References

- Deployment env summary: [`DEPLOYMENT_INSIGHTS.md`](DEPLOYMENT_INSIGHTS.md)
- Marketing site checklist (sitemap/RSS conventions): separate repo rule `opticwise-html/.cursor/rules/OW_insights_publish_seo_aeo.mdc` (OWnet now updates those files on publish; local `node scripts/build-insights-index.mjs` still valid for manual edits).

**Questions:** Bill / whoever merged this feature branch.
