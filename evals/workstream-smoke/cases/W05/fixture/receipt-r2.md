# R-02 worker receipt

```yaml
task_id: R-02
result: succeeded
verification_depth: targeted
claims:
  - claim: producer-schema-updated
    acceptance_refs: [A2]
    evidence_kind: schema
    ref_or_version: api-42
    environment: CI
    command_or_source: "schema check report ci-301"
    result: passed
    observed_at: 2026-09-04T08:10:00+08:00
    limitations_or_unverified_gaps: consumer integration not checked
    recovery_pointer: api-42
  - claim: consumer-generated-client-updated
    acceptance_refs: [A3]
    evidence_kind: git-diff
    ref_or_version: web-88
    environment: local workspace
    command_or_source: "pnpm typecheck report web-88"
    result: passed
    observed_at: 2026-09-04T08:12:00+08:00
    limitations_or_unverified_gaps: producer-consumer compatibility not checked
    recovery_pointer: web-88
```

The local producer and consumer claims are individually supported, but the integration gate is intentionally missing.
