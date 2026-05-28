---
id: adr-0005
title: Access-control tiers for the brain
type: decision
status: active
visibility: internal
sensitivity_reviewed: 2026-05-26
sensitivity_candidate: internal
updated: 2026-05-26
tags: [architecture, access-control, security, rag]
---

## Context

The brain contains material at different sensitivity levels. Some content
(proof points, playbooks) is cleared for external audiences; most is internal
to the team; a small subset — competitive intelligence, acquirer positioning,
board-level strategy — must be excluded from general OWnet/RAG queries and
restricted to principals only.

A 2026-05-23 flag in `knowledge/competitive-landscape` asked Bill and Danny to
decide whether "internal" files should still be broadly queryable. This ADR
resolves that question.

## Decision

Three visibility tiers, set via the `visibility` frontmatter field:

| Tier | Value | Who can query | Example content |
|------|-------|---------------|-----------------|
| **Shareable** | `shareable` | Anyone, including outside audiences | Approved proof points, case studies, published frameworks |
| **Internal** | `internal` | OpticWise team (queryable via OWnet) | Personas, playbooks, sales talk tracks, operational knowledge |
| **Internal-restricted** | `internal-restricted` | Bill and Drew only (plus Danny as pipeline owner) | Competitive SWOT, acquirer positioning, board/principal-level strategy |

### Files classified as internal-restricted today

- `knowledge/competitive-landscape.md`
- `decisions/0002-acquirer-positioning-scope.md`

### Files that stay internal (not restricted)

- `knowledge/bill-douglas-persona.md`
- `knowledge/drew-hall-persona.md`
- `knowledge/pm-billing-friction.md`

### Forward rule

The following categories default to `internal-restricted` unless explicitly
downgraded:

- Acquisition / exit positioning
- Competitor SWOT and named-competitor analysis
- Board-level and principal-level strategy

## Enforcement

The enforcement mechanism — how OWnet excludes `internal-restricted` content
from general RAG queries and limits access to the principals — is Danny's
implementation responsibility per the OWnet handoff. This ADR defines the
policy; the pipeline implements it.

## Why

"Internal" alone is too broad: it means the whole team can surface competitive
intelligence and acquirer positioning in routine queries. A restricted tier
keeps sensitive strategy material available to the people who need it without
leaking it into general-purpose answers.

**Rejected:** Two-tier (shareable / internal) — insufficient granularity for
board-level and competitive content. The 2026-05-23 flag demonstrated the gap.
