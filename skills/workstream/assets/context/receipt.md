---
task_id: "{{task_id}}"
workstream_id: "{{workstream_id}}"
result: "{{result}}"
execution_target: "{{execution_target}}"
reported_at: "{{reported_at}}"
verification_depth: targeted
lead_verification: pending
---

# Outcome

{{actual_outcome}}

# Changes

- {{change_or_artifact}}

# Validation

- {{validation_and_result}}

Worker validation records observations from the Task-owned scope. It is not Lead verification and does not by itself move the Task beyond `reported`.

# Claim-evidence mapping

Map every claim to the acceptance item it supports and to evidence that can be independently traced:

| Claim | Acceptance refs | Evidence kind | Exact ref/version | Environment | Command or source | Result | Observed at | Limitations or unverified gaps | Recovery pointer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| {{claim_id}} | {{acceptance_refs}} | {{evidence_kind}} | {{exact_ref_or_version}} | {{environment}} | {{command_or_source}} | {{evidence_result}} | {{observed_at}} | {{limitations_or_unverified_gaps}} | {{recovery_pointer}} |

# Integration gate results

| Gate | Producer | Consumer | Expected version or contract | Evidence ref | Result | Observed at | Limitations or unverified gaps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| {{integration_gate_id}} | {{producer}} | {{consumer}} | {{expected_version_or_contract}} | {{integration_evidence_ref}} | {{integration_result}} | {{integration_observed_at}} | {{integration_limitations}} |

# Observed state

- {{ref_version_or_external_state}}

# Deviations and decisions

- {{deviation_or_decision}}

# Task handoff

- Lifecycle reported by this receipt: `reported`; lead must verify before marking the Task `verified`.
- Readiness at execution: `{{readiness}}`
- Verification depth requested by the Task: `{{verification_depth}}` (default: `targeted`)
- Lead verification status: `pending`; record any escalation trigger and additional check before changing it.

# Limitations and unverified gaps

- {{limitation_or_unverified_gap}}

# Open issues

- {{open_issue}}

# Recovery

- {{recovery_information}}
