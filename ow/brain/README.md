# OWnet Brain (vendored canon)

This folder is the **single source of truth** for the OWnet agent's positioning,
voice, proof, terminology, personas, and sales motion. It is the OpticWise
"OWnet Brain" authored by Bill, vendored into the app so it deploys with OWnet
on Render and is readable at ingest time.

## Layout

```
rules/        Prescriptive behavior ("always/never"). Short, one concept per file.
              These become the agent's ALWAYS-ON guardrail (RULES_PACK).
knowledge/    Reference facts. Chunked + embedded, retrieved by similarity (RAG).
decisions/    Architecture Decision Records (governance + durable company facts).
```

Every file carries frontmatter: `id, title, type, status, visibility, updated, tags`.

## How it propagates to the agent

The Brain is **upstream**. Nothing in the app writes back into these files —
canon changes are human edits here, then propagated by re-running the ingester:

```bash
cd ow
npx tsx scripts/ingest-brain.ts --reingest
```

That command:
1. Reads every file here, honoring governance (see below).
2. Writes `type: knowledge` (and rules, for citation) into `KnowledgeDocument` /
   `KnowledgeChunk` (category `Brain — <Type>`) for RAG retrieval.
3. Regenerates [`ow/lib/brain-canon.generated.ts`](../lib/brain-canon.generated.ts)
   with the always-on `RULES_PACK` and the full Bill/Drew `PERSONAS`.

## Governance honored by the ingester (do not bypass)

- **Only `status: active` propagates.** `draft` and `deprecated` are excluded.
- **`visibility` tiers** gate where content surfaces:
  - `shareable` — cleared for outside audiences.
  - `internal` — queryable by the OpticWise team via OWnet (most of the Brain).
  - `internal-restricted` — excluded from general queries; surfaced only to
    principals (Bill, Drew, Danny) via `BRAIN_PRINCIPAL_EMAILS`.
- **Upstream-only.** The agent never edits this folder.

## Source authority

When sources conflict, `rules/source-authority.md` wins. The Brain supersedes
the legacy Drive `Canon — *` corpus for positioning and voice.
