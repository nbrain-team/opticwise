---
id: adr-0004
title: Git/GitHub is the authoritative store and backup
type: decision
status: active
visibility: internal
sensitivity_reviewed: 2026-05-26
sensitivity_candidate: internal
updated: 2026-05-26
tags: [architecture, infrastructure, source-of-truth, git]
---

## Context

On 2026-05-23 a file (`HOW-I-WORK.md`) was lost to a Google Drive sync gap.
Confirming the brain's state required filesystem forensics — checking
modification times, searching Trash, and piecing together what had actually
been persisted versus what Drive had silently failed to sync. The incident
demonstrated that Drive sync is not a reliable authority or backup for the
canonical brain.

## Decision

The canonical OWnet brain lives in git at
`github.com/bdouglas-ow/ownet-brain` (private repo). The local working copy
is `~/projects/ownet-brain`, deliberately **outside** the Google Drive stream.
Google Drive and any local machine are working copies only — never the
authority.

OWnet and all tools ingest from the git repo. After meaningful changes, commit
and push.

## Why

Git provides full history, redundancy across every clone, and a single
authority that no individual machine or sync service can compromise. Every
change is versioned; any state can be recovered; diffs are inspectable.

**Rejected alternative: Drive-only sync.** No version history, no undo beyond
a narrow window, single point of failure, and demonstrated data loss on
2026-05-23. Drive is a convenience layer, not an infrastructure layer.
