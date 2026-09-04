# Invalid blocker candidates

These proposed Task blocker entries are invalid and must not participate in runnable evaluation:

```yaml
- task: T-204
  blocker:
    ref: review:RV-001
    kind: owner-decision
    reason: inspect item was incorrectly treated as approval
- task: T-205
  blocker:
    ref: review:RV-002
    kind: owner-decision
    reason: advisory feedback was incorrectly treated as required
```

To make either item blocking, the Lead must first promote the review to active `intent: decide`, record why owner authority is required, and then add the Task blocker.
