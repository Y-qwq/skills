# Task board (schema_version: 2)

```yaml
tasks:
  - id: T-101
    readiness: ready
    lifecycle: reported
    current_attempt_id: AT-001
    dependencies: []
    blockers: []
    acceptance:
      - id: AC-001
        criterion: import writes the normalized message record
  - id: T-102
    readiness: ready
    lifecycle: reported
    current_attempt_id: AT-001
    dependencies:
      - ref: environment:staging-import
        required_condition: available
    blockers: []
    acceptance:
      - id: AC-001
        criterion: import can be smoke-tested in the target environment
  - id: T-103
    readiness: ready
    lifecycle: reported
    current_attempt_id: AT-001
    dependencies: []
    blockers: []
    acceptance:
      - id: AC-001
        criterion: old import path is no longer the selected implementation
    replacement_task: T-104
```

The Task records are the current lifecycle source. The receipts below are observations from separate attempts, not a second lifecycle board.
