# Insights publisher — deployment

After pulling this branch, run migrations and install the new dependency:

```bash
cd ow
npm install
npx prisma migrate deploy
npx prisma generate
```

## Environment variables (OWnet / Render web service)

| Variable | Required | Purpose |
|----------|----------|---------|
| `GITHUB_TOKEN` | Yes for publish | PAT or GitHub App token with `contents:write` on `nbrain-team/opticwise-html`. |
| `INSIGHTS_REPO_OWNER` | Optional | Default `nbrain-team`. |
| `INSIGHTS_REPO_NAME` | Optional | Default `opticwise-html`. |
| `INSIGHTS_REPO_BRANCH` | Optional | Default `main`. |
| `INSIGHTS_CRON_SECRET` | Yes for scheduling | Long random string. Cron job must send `Authorization: Bearer <secret>` or `?secret=` when calling the publish-due endpoint. |
| `NEXT_PUBLIC_APP_URL` | Optional | Public base URL of OWnet (e.g. `https://ownet.opticwise.com`). Improves image URL rewriting in the body if asset URLs are absolute. |

## Scheduled posts

1. Set `INSIGHTS_CRON_SECRET` on the OWnet service.
2. Create a **Render Cron Job** (or other scheduler) every 5 minutes:

   - **URL:** `https://ownet.opticwise.com/api/insights/cron/publish-due`
   - **Header:** `Authorization: Bearer <INSIGHTS_CRON_SECRET>`

   Alternatively: `GET` the same URL with `?secret=<INSIGHTS_CRON_SECRET>`.

## Roxana / editor accounts

- Admins can create users with `role: "editor"` via `POST /api/users` (body includes `"role": "editor"`), or set `editor` on an existing user in **Settings → Users** (same API as user edit).

## Static site

No new env vars on the **opticwise-html** static service. Pushes to `main` continue to deploy via Render as today.
