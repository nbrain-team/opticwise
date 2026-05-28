---
id: adr-0006
title: "Repo home: personal account for now, org move deferred"
type: decision
status: active
visibility: internal
sensitivity_reviewed: 2026-05-26
sensitivity_candidate: internal
updated: 2026-05-26
tags: [architecture, infrastructure, git]
---

## Context

The brain repo lives at `github.com/bdouglas-ow/ownet-brain` (private,
Bill's personal account). The natural long-term home is the `opticwise` GitHub
org, but Bill is not yet an org member/owner — that requires Danny to add him.

## Decision

The repo stays at `github.com/bdouglas-ow/ownet-brain` for now. Local working
copy (`~/projects/ownet-brain`) and `origin` remote remain unchanged. The move
to the `opticwise` org is deferred until Bill is added as an org member/owner
by Danny.

## Why

Moving the repo before org access is set up would break the push path and
create unnecessary churn. One move, once, when the org is ready.
