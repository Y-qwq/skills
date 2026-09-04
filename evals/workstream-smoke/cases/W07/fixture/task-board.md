# Task board (schema_version: 2)

```yaml
tasks:
  - id: T-201
    readiness: ready
    lifecycle: reported
    current_attempt_id: AT-001
    dependencies: []
    blockers: []
    acceptance: [AC-001]
  - id: T-202
    readiness: ready
    lifecycle: backlog
    current_attempt_id: null
    dependencies: []
    blockers:
      - ref: review:RV-003
        kind: owner-decision
        reason: owner must choose the release policy
    acceptance: [AC-001]
  - id: T-203
    readiness: ready
    lifecycle: in_progress
    current_attempt_id: AT-001
    dependencies: []
    blockers: []
    acceptance: [AC-001]
```

`T-201` can become `verified`; `T-203` can continue. Only `T-202` is blocked by the owner decision.
