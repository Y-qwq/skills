# Task verification contracts

```yaml
- id: R-01
  lifecycle: reported
  verification_depth: receipt-only
  acceptance: [A1]
  required_evidence: ["diff at commit docs-17 in the local workspace"]
- id: R-02
  lifecycle: reported
  verification_depth: targeted
  acceptance: [A2, A3]
  required_evidence:
    - "producer schema contract at api-42"
    - "consumer generated client at web-88"
  integration_gates:
    - "producer api-42 is compatible with consumer web-88"
- id: B-01
  lifecycle: backlog
  readiness: ready
  acceptance: [A4]
- id: SEC-01
  lifecycle: backlog
  readiness: ready
  verification_depth: independent
  acceptance: [A5]
  risk: high
```
