# Task: Content Summary

Build the weekly content summary doc. This is deterministic — no LLM needed.

## Inputs

- Email list (count, pagination warnings)
- Selected trends (both, with rationale)
- Alternative trends (set aside, with reasons)
- Package outputs (both authors)
- Run ID
- Publish times (both blogs, both LinkedIn shorts)

## Output sections

1. Run metadata (ID, timestamp, duration)
2. Emails processed (count, any pagination boundary warnings)
3. Trends selected (one-line rationale each)
4. Alternatives set aside (one-line reason each)
5. File list (Drive paths for all 8 assets)
6. Exact publish times for each scheduled piece
7. Validation results (all checks passed or failures named)
8. Token usage and rough cost estimate
