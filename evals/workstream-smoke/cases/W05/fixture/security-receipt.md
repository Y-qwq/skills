# SEC-01 worker receipt returned in Turn 3

```yaml
task_id: SEC-01
result: succeeded
requested_verification_depth: independent
effective_verification_depth: null
lead_verification:
  status: pending
  escalation_trigger: null
  additional_checks: []
claims:
  - claim: permission-migration-safe
    acceptance_refs: [A5]
    evidence_kind: command
    ref_or_version: migration-12
    environment: unknown
    command_or_source: "migration-check report old-run"
    result: passed
    observed_at: 2026-09-03T18:00:00+08:00
    limitations_or_unverified_gaps: runtime authorization boundary and rollback were not tested
    recovery_pointer: migration-12
```

The receipt is stale relative to the current observation time, has an unknown environment, and explicitly leaves high-risk gaps.
