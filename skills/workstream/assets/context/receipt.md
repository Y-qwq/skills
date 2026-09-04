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

Worker validation records observations from this attempt's Task-owned scope. It is not Lead verification and does not by itself move the Task beyond `reported`.

# Claim-evidence mapping

Map every claim to a stable `AC-*` acceptance item and to evidence observed after this attempt. The Task contract's required evidence is a specification; this table records actual evidence:

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

- The worker returns a structured payload; the Lead creates this canonical attempt record and initially records the Task as `reported`.
- After that write, the observed evidence and worker result are sealed. The Lead may update only the frontmatter `lead_verification` fields while making the lifecycle decision.
- Read the worker result, requested/effective depth, outcome and timestamps from frontmatter; do not duplicate their current values in this body.
- Every non-pending outcome records `decided_at`. `verified_at` is non-null only for `outcome: accepted` when the Task lifecycle is `verified`.
- After a non-pending Lead decision, the entire attempt record is finalized. A retry creates a different `AT-*` file and never overwrites this one.

Lead decisions have one current Task lifecycle truth:

| Lead outcome | Task lifecycle | Required follow-up |
| --- | --- | --- |
| `accepted` | `verified` | Promote stable conclusions and compact when appropriate. |
| `retry` | `backlog` | Preserve this attempt and create a new `AT-*` receipt on the next execution. |
| `blocked` | `backlog` | Add an active typed `blockers[]` entry on the Task; do not invent a `blocked` lifecycle. |
| `cancelled` | `cancelled` | Record owner decision and reason. |
| `superseded` | `superseded` | Record the replacement Task or decision pointer. |

# Limitations and unverified gaps

- {{limitation_or_unverified_gap}}

# Open issues

- {{open_issue}}

# Recovery

- {{recovery_information}}
