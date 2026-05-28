---
id: adr-0001
title: Adopt a single canonical source of truth
type: decision
status: active
visibility: internal
sensitivity_reviewed: 2026-05-22
sensitivity_candidate: shareable
updated: 2026-05-22
tags: [architecture, process]
---

## Context
Knowledge lived in several places (Cursor, Claude, OWnet) and drifted. Updates
were pasted per-tool, so no version was authoritative.

## Decision
One git repo (`ownet-brain`) holds hand-edited canonical files. All other
artifacts (Cursor rules, Claude context pack, OWnet RAG input) are GENERATED
from it by `scripts/build.py`.

## Why
Eliminates drift by construction: there is exactly one place to edit, and
"latest commit" equals "latest everywhere." Rejected: per-tool copies (current
pain) and a database-first store (heavier, worse diffs, no plain-text history).
