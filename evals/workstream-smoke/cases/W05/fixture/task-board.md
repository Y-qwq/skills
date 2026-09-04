# Task verification contracts (schema_version: 2)

```yaml
- id: R-01
  lifecycle: reported
  current_attempt_id: AT-001
  verification_depth: receipt-only
  acceptance: [AC-001]
  required_evidence:
    - kind: git-diff
      subject: documentation artifact matches the contract
      required_environment: local workspace
      command_or_source: "git diff --check"
      freshness_or_ref_requirement: current task artifact ref
- id: R-02
  lifecycle: reported
  current_attempt_id: AT-001
  verification_depth: targeted
  acceptance: [AC-002, AC-003]
  required_evidence:
    - kind: schema
      subject: producer API contract
      required_environment: CI or contract workspace
      command_or_source: schema check report
      freshness_or_ref_requirement: current producer contract version
    - kind: generated-artifact
      subject: consumer generated client
      required_environment: consumer workspace
      command_or_source: typecheck report
      freshness_or_ref_requirement: generated from the current producer contract
  integration_gates:
    - id: producer-consumer-compatible
      between: producer API -> consumer client
      required_evidence:
        - kind: integration-check
          subject: producer and consumer compatibility
          required_environment: integration workspace
          command_or_source: contract compatibility check
          freshness_or_ref_requirement: same current producer and consumer versions
- id: B-01
  lifecycle: backlog
  readiness: ready
  dependencies: []
  blockers: []
  acceptance: [AC-004]
- id: SEC-01
  lifecycle: backlog
  readiness: ready
  dependencies: []
  blockers: []
  verification_depth: independent
  acceptance: [AC-005]
  risk: high
```
