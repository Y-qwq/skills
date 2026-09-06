---
schema_version: 2
task_id: "{{task_id}}"
attempt_id: "{{attempt_id}}"
workstream_id: "{{workstream_id}}"
result: "{{result}}"
execution_target: "{{execution_target}}"
readiness_at_execution: "{{readiness}}"
started_at: "{{started_at}}"
reported_at: "{{reported_at}}"
requested_verification_depth: "{{requested_verification_depth}}"
lead_verification:
  outcome: pending
  effective_depth: null
  decided_at: null
  verified_at: null
  escalation_trigger: null
  additional_checks: []
---

# Outcome

{{actual_outcome}}

# Changes

- {{change_or_artifact}}

# Validation

- {{validation_and_result}}

# Claim-evidence mapping

记录本次真实观察，而不是复制 Task 的预期证据：

| Claim | Acceptance refs | Evidence kind | Exact ref/version | Environment | Command or source | Result | Observed at | Limitations or unverified gaps | Recovery pointer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| {{claim_id}} | {{acceptance_refs}} | {{evidence_kind}} | {{exact_ref_or_version}} | {{environment}} | {{command_or_source}} | {{evidence_result}} | {{observed_at}} | {{limitations_or_unverified_gaps}} | {{recovery_pointer}} |

# Integration gate results

| Gate | Producer | Consumer | Expected version or contract | Evidence ref | Result | Observed at | Limitations or unverified gaps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| {{integration_gate_id}} | {{producer}} | {{consumer}} | {{expected_version_or_contract}} | {{integration_evidence_ref}} | {{integration_result}} | {{integration_observed_at}} | {{integration_limitations}} |

# Observed state

- Attempt identity is read from frontmatter.
- {{ref_version_or_external_state}}

# Deviations and decisions

- {{deviation_or_decision}}

# Task handoff

Worker 返回 payload，Lead 写入后封存观察，只回写 frontmatter 的 `lead_verification`；非 pending 决定后整份记录封存，重试另建 AT。Task lifecycle 只写在 Task 中，转换与时间戳规则遵循 skill 的 Lead verification 协议，不在每份 receipt 重复维护。

# Limitations and unverified gaps

- {{limitation_or_unverified_gap}}

# Open issues

- {{open_issue}}

# Recovery

- {{recovery_information}}
