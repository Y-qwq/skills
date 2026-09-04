---
schema_version: 2
id: "{{task_id}}"
workstream_id: "{{workstream_id}}"
readiness: "{{readiness}}"
lifecycle: backlog
priority: normal
dependencies: []
blockers: []
owner: "{{task_owner}}"
lead: "{{lead}}"
execution_target: null
one_shot_schedule_request: null
execution_override: null
verification_depth: targeted
current_attempt_id: null
verification:
  claims:
    - id: "{{claim_id}}"
      acceptance_refs:
        - "AC-001"
      required_evidence:
        - kind: "{{evidence_kind}}"
          subject: "{{evidence_subject}}"
          required_environment: "{{required_environment}}"
          command_or_source: "{{command_or_source}}"
          freshness_or_ref_requirement: "{{freshness_or_ref_requirement}}"
  integration_gates:
    - id: "{{integration_gate_id}}"
      between: "{{producer_and_consumer}}"
      required_evidence:
        - kind: "{{integration_evidence_kind}}"
          subject: "{{integration_evidence_subject}}"
          required_environment: "{{integration_required_environment}}"
          command_or_source: "{{integration_command_or_source}}"
          freshness_or_ref_requirement: "{{integration_freshness_or_ref_requirement}}"
created_at: "{{created_at}}"
updated_at: "{{updated_at}}"
---

# Objective

{{objective}}

# Contribution to outcome

{{outcome_connection}}

# Ownership

- Read the Task owner, Lead and current execution target from frontmatter. Read the workstream owner from `context.md`; do not duplicate current ownership values here.

# Scope

## Owned

- {{owned_scope}}

## Preserve or exclude

- {{preserved_or_excluded_scope}}

# Dependencies

- Inputs: {{inputs}}
- Consumers: {{consumers}}
- Typed `dependencies` in frontmatter are the canonical prerequisite graph. Each entry names a stable `ref` and the required lifecycle or external condition.
- Typed `blockers` in frontmatter are the only canonical active blockers. Each entry names a `ref`, `kind`, and `reason`; remove or resolve the entry when the condition clears.
- Dependencies satisfied and runnable status are derived at scheduling time; do not persist a `runnable` field or duplicate blocker lists in the body.

# Working area

- Workspace: {{workspace}}
- Branch, module, or artifact: {{working_area}}

# Authority and stopping conditions

- Allowed mutations: {{allowed_mutations}}
- Stop when: {{stopping_condition}}
- One-shot schedule requests and pre-ready execution overrides are read from frontmatter; do not duplicate their current values here.

# Acceptance

- AC-001: {{acceptance_criterion}}

# Verification

- {{verification_requirement}}

## Verification contract

- Read the requested depth from frontmatter `verification_depth` (`receipt-only` | `targeted` | `independent`).
- Required evidence is an execution-time specification: define its kind, subject, required environment, command or source, and freshness/ref requirement; do not invent an actual ref/version before execution.
- Claims must map to stable `AC-*` acceptance refs and required evidence specifications.
- Integration gates must identify producer, consumer, expected version or contract, and the evidence specification that will prove compatibility.

# Context pointers

- {{context_pointer}}

# Attempts

- Read `current_attempt_id` from frontmatter. It points to the attempt whose evidence currently supports the Task's lifecycle decision; a retry gets a new `AT-001`, `AT-002`, ... ID and updates the pointer without replacing the earlier record.
- Worker-observed evidence is sealed after the Lead records the Task as `reported`. The Lead may then update only `lead_verification`; after a non-pending decision the attempt record is finalized. It never changes Task lifecycle on its own.

# Expected receipt

Return a structured payload containing outcome, actual changes, worker validation, claim-to-acceptance mapping, actual evidence with exact refs/versions/environments, commands or sources, results, observed_at, limitations/unverified gaps, deviations, open issues, and recovery information. The Lead writes it to `receipts/{{task_id}}/<attempt-id>.md`. Required evidence comes from this Task contract; observed evidence is recorded only after execution. The receipt reports `reported`; Lead verification decides whether the Task becomes `verified`, returns to `backlog` for retry or a blocker, or reaches `cancelled`/`superseded`.
