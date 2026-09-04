# Existing state

```yaml
execution_mode: capture
wip_limit: 4
hot_tasks:
  - id: S-01
    lifecycle: scheduled
    readiness: ready
  - id: P-01
    lifecycle: in_progress
    readiness: ready
  - id: R-01
    lifecycle: reported
    readiness: ready
  - id: R-02
    lifecycle: reported
    readiness: ready
backlog_tasks:
  - id: B-01
    lifecycle: backlog
    readiness: ready
  - id: SEC-01
    lifecycle: backlog
    readiness: ready
    risk: high
```

The initial WIP is four. `backlog` tasks do not count toward WIP. The fixture does not authorize scheduling during Turn 1.
