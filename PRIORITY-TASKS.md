# Priority Tasks

> Living document tracking active priority items for the Minuteman Control platform.
> Cross-referenced with `WEEKLY-CLIENT-UPDATES.md` for client reporting.

---

## Active Tasks

### [P1] Run the Content Engine canon ingest + voice exemplar ingest in production
**Added:** 2026-05-07
**Status:** Ready to run
**Context:** Track 1 + Track 3 of the OWnet advanced training upgrade (May 7, 2026). The scripts are committed; they need to be executed against the production database before the new prompt + voice exemplar retrieval pipeline goes live.

- 2026-05-07: Run `npx tsx scripts/ingest-content-engine-canon.ts` from `ow/` (use `--dry-run` first to confirm classification). Then run `npx tsx scripts/ingest-voice-exemplars.ts`. Both scripts read from Bill's local Content Engine folder by default; override with `CONTENT_ENGINE_PATH` / `VOICE_EXEMPLAR_PATH` if running on Render.
- 2026-05-07: After ingestion, smoke-test the chat agent with: "draft a LinkedIn article in Bill's voice on owner-controlled data planes" and confirm voice exemplars appear in the system prompt (look for `[OWnet] Injected N voice exemplars for content gen.` in logs).

### [P1] Build the regression eval baseline from the May 6 + April 19 gold exemplars
**Added:** 2026-05-07
**Status:** Ready to run
**Context:** Track 5 of the OWnet advanced training upgrade. Establishes a stable canon-adherence baseline so every future prompt change can be measured against the same gold pieces.

- 2026-05-07: From `ow/`, run `npx tsx scripts/build-content-eval-set.ts` to write per-piece JSON cases to `ow/data/content-engine-eval/`. Then run `npx tsx scripts/run-content-engine-eval.ts --no-generate` to score the gold pieces only (sanity check on the scorer). Then `npx tsx scripts/run-content-engine-eval.ts --limit=2` to score gold + generated for two cases as a smoke test before running the full set.
- 2026-05-07: Commit the resulting `eval-report-YYYY-MM-DD.md` as the v1 baseline.

### [P2] Decide whether the Content Engine page should run on Bill's Wednesday 8pm schedule
**Added:** 2026-05-07
**Status:** Open
**Context:** Track 4 ships the Content Engine workflow as an on-demand page at `/content-engine`. The Content Engine FINAL doc says it should run every Wednesday at 8pm. We can wire a cron job to `POST /api/content-engine/run` with the internal-API-key header, but that requires a decision on whether autonomous publishing is desired or whether Bill wants a manual review step before Drive Bridge POST.

- 2026-05-07: Awaiting Bill's call. Default for now is manual: Bill triggers from the page, reviews packages, ticks "POST to Drive Bridge", then submits.

---

## Completed Tasks

### [P1] OWnet Agent advanced training — five-track canon upgrade
**Completed:** 2026-05-07
**Summary:** Analyzed the OpticWise Content Engine project folder (Bill's canonical brand/voice/training corpus). Shipped: (1) canon-ingest script that loads every Content Engine `.md`/`.gs`/`.docx` into the knowledge base with priority categories; (2) full rewrite of `ow/lib/brandscript-prompt.ts` to the May 2026 canon (four moats, asset-manager lens, Bill/Drew author switching, banned words, trademark first-use, proof gate, canonical signoff); (3) voice-exemplar ingest + retrieval pipeline using the published `.docx` blog packages; (4) full Content Engine agent mode with API route at `/api/content-engine/run` and admin UI at `/content-engine`; (5) regression eval set + canon-adherence scorer using the gold exemplars. See `WEEKLY-CLIENT-UPDATES.md` 2026-05-07 entry for the full rundown.

---

## Log

| Date | Action | Task | Notes |
|------|--------|------|-------|
| 2026-05-07 | Completed | OWnet advanced training (5 tracks) | Canon ingest, prompt rewrite, voice exemplars, Content Engine mode, eval set |
| 2026-05-07 | Added | Run canon + voice exemplar ingest in production | P1, ready to run |
| 2026-05-07 | Added | Build regression eval baseline | P1, ready to run |
| 2026-05-07 | Added | Decide Wednesday 8pm Content Engine cron | P2, awaiting Bill |
