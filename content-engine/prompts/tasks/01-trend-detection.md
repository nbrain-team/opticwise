# Task: Trend Detection

From the source emails, identify exactly TWO trends to ship this week — one for Bill (strategy / markets / AI / capital) and one for Drew (architecture / systems / OT / security).

## Eligibility rules (strict)

- Each trend must be supported by 3+ sources from the inbox.
- Cross-signal synthesis is worth more than the most-covered single story.
- A trend is NOT eligible if its entry point is already covered by 3+ mainstream CRE trade publications in the same framing.
- Map each trend to one of the four moats: data, workflows, orchestration, operating-standard.

## Lane assignments

Bill's lanes: capital markets, AI developments, regulatory shifts, M&A patterns, owner strategy, broader tech moves.
Drew's lanes: building systems vendor patterns, integration reality, resilience, OT/network security, AI infrastructure at the building level, standards bodies, OT governance.

## Output schema

Return JSON matching:
```json
{
  "billTrend": {
    "title": "...",
    "lane": "capital|ai|regulation|proptech|tenant|strategy|tech",
    "supportingSourceIds": ["..."],
    "ownerImplication": "...",
    "fallbackMode": false
  },
  "drewTrend": { "...same shape..." },
  "alternatives": [
    { "title": "...", "lane": "...", "reasonSetAside": "..." }
  ]
}
```

## Validation

Reject if either trend has fewer than 3 supporting sources unless fallbackMode: true with rationale.
