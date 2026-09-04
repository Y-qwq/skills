# R-01 worker receipt

```yaml
task_id: R-01
result: succeeded
verification_depth: receipt-only
claims:
  - claim: docs-match-contract
    acceptance_refs: [A1]
    evidence_kind: git-diff
    ref_or_version: docs-17
    environment: local workspace
    command_or_source: "git diff --check docs-17^ docs-17"
    result: passed
    observed_at: 2026-09-04T08:00:00+08:00
    limitations_or_unverified_gaps: none
    recovery_pointer: docs-17
```

The worker supplied the exact commit and a complete low-risk evidence mapping. No runtime claim is made.
