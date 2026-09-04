---
schema_version: 2
workstream_id: owner-attention
execution_mode: steady
wip_limit: 4
---

# Derived state projection

The Lead must rebuild this projection from Task and review records after the work cycle. It must not be used to invent a persisted session status.

```yaml
hot_tasks:
  - id: T-201
    lifecycle: reported
    current_attempt_id: AT-001
  - id: T-203
    lifecycle: in_progress
backlog:
  - id: T-202
    lifecycle: backlog
    blockers:
      - ref: review:RV-003
        kind: owner-decision
        reason: choose the release policy
owner_attention:
  - id: RV-001
    intent: inspect
    status: queued
  - id: RV-002
    intent: advise
    status: presented
  - id: RV-003
    intent: decide
    status: queued
```
