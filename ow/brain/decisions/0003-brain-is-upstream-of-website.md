---
id: adr-0003
title: Brain is upstream of website — permanent arrow
type: decision
status: active
visibility: internal
sensitivity_reviewed: 2026-05-25
sensitivity_candidate: internal
updated: 2026-05-25
tags: [architecture, process, website, source-of-truth]
---

## Context

The OWnet brain is the single source of truth; the website is a downstream
OUTPUT of the brain, not a peer source. As of 2026-05-23 the website is
temporarily ahead because it was built directly with AI rather than generated
from the brain; as a one-time reconciliation we are using the website's vetted
language to bring the brain current. After that, the arrow is permanent: the
brain changes first, and the website is regenerated from the brain. The website
is never again treated as canon that overrides the brain.

## Decision

Brain → website. One direction. Permanent.

## Rationale

Prevents two competing sources of truth. Retraining the brain is what
propagates everywhere, including the site. If the website is allowed to act as
a peer canon, edits drift, the brain falls behind, and the single-source-of-
truth architecture (ADR-0001) breaks by construction.

## One-time exception

The 2026-05-23 reconciliation pass pulls vetted language from the website back
into the brain. This is a one-time bootstrap, not a precedent. Once complete,
the website becomes a generated artifact — same status as INDEX.md, dist/, and
.cursor/rules/.
