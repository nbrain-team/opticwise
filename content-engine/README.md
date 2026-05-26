# OpticWise Content Engine

Weekly content generation engine. Reads Gmail, generates thought leadership content via Claude, publishes via OWnet.

## What it does

1. Reads all threads under Gmail label `2day-wd-inbox-2day-wd-read`
2. Identifies two trends — one for Bill Douglas, one for Drew Hall
3. Produces six content outputs (two blogs, two LinkedIn articles, two LinkedIn short posts)
4. Generates hero and OG images via Ideogram
5. Saves to Google Drive (`My Drive/201 - OW Blog (Insights)/YYYY-MM-DD/`)
6. Schedules blog posts via OWnet insights scheduler (Friday 8:45 AM Drew, Monday 8:45 AM Bill)
7. Schedules LinkedIn short posts via OWnet social tool
8. Archives Gmail threads after all saves are verified
9. Sends Slack notification with run summary

## Schedule

- **Runs:** Wednesday 8:00 PM America/Denver (via GitHub Actions cron)
- **Drew's content publishes:** Friday 8:45 AM Denver
- **Bill's content publishes:** Monday 8:45 AM Denver

## Commands

```bash
npm ci                         # Install dependencies
npm run start                  # Full production run
npm run dry-run                # Real Gmail + Claude, no OWnet calls, no archive
npm run replay -- --week YYYY-MM-DD        # Replay past week (sandbox)
npm run replay -- --week YYYY-MM-DD --commit  # Replay past week (production)
npm run verify-secrets         # Smoke-test all credentials
```

## Architecture

See `BUILD.md` for the full specification.
