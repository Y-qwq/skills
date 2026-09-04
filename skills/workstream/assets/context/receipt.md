---
task_id: "{{task_id}}"
workstream_id: "{{workstream_id}}"
result: "{{result}}"
execution_target: "{{execution_target}}"
reported_at: "{{reported_at}}"
requested_verification_depth: "{{requested_verification_depth}}"
effective_verification_depth: "{{effective_verification_depth}}"
lead_verification:
  status: pending
  escalation_trigger: null
  additional_checks: []
---

# Outcome

{{actual_outcome}}

# Changes

- {{change_or_artifact}}

# Validation

- {{validation_and_result}}

Worker validation records observations from the Task-owned scope. It is not Lead verification and does not by itself move the Task beyond `reported`.

# Claim-evidence mapping

Map every claim to the acceptance item it supports and to evidence observed after execution. The Task contract's required evidence is a specification; this table records actual evidence:

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
- Requested verification depth from the Task: `{{requested_verification_depth}}` (default: `targeted`)
- Effective verification depth applied by Lead: `{{effective_verification_depth}}`; record an escalation before changing it.
- Lead verification status: `pending`; record status, escalation trigger and additional checks in `lead_verification` before changing it.
- Escalation trigger: `{{escalation_trigger}}`
- Additional checks: `{{additional_checks}}`

# Limitations and unverified gaps

- {{limitation_or_unverified_gap}}

# Open issues

- {{open_issue}}

# Recovery

- {{recovery_information}}
