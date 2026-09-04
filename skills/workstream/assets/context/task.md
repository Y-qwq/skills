---
id: "{{task_id}}"
workstream_id: "{{workstream_id}}"
readiness: "{{readiness}}"
lifecycle: backlog
priority: normal
blocked_by: []
depends_on: []
owner: "{{task_owner}}"
lead: "{{lead}}"
execution_target: null
one_shot_schedule_request: null
execution_override: null
verification_depth: targeted
verification:
  claims:
    - id: "{{claim_id}}"
      acceptance_refs:
        - "{{acceptance_id}}"
      required_evidence:
        - kind: "{{evidence_kind}}"
          ref_or_version: "{{exact_ref_or_version}}"
          environment: "{{environment}}"
          command_or_source: "{{command_or_source}}"
  integration_gates:
    - id: "{{integration_gate_id}}"
      between: "{{producer_and_consumer}}"
      required_evidence: "{{integration_evidence}}"
created_at: "{{created_at}}"
updated_at: "{{updated_at}}"
---

# Objective

{{objective}}

# Contribution to outcome

{{outcome_connection}}

# Ownership

- Workstream owner: {{workstream_owner}}
- Lead: {{lead}}
- Task owner: {{task_owner}}
- Execution target: null until scheduled

# Scope

## Owned

- {{owned_scope}}

## Preserve or exclude

- {{preserved_or_excluded_scope}}

# Dependencies

- Inputs: {{inputs}}
- Consumers: {{consumers}}
- Blocking tasks: {{blocking_tasks}}
- `blocked_by`: {{blocked_by}}
- Dependencies satisfied: {{dependencies_satisfied}}

# Working area

- Workspace: {{workspace}}
- Branch, module, or artifact: {{working_area}}

# Authority and stopping conditions

- Allowed mutations: {{allowed_mutations}}
- Stop when: {{stopping_condition}}
- One-shot schedule request: {{one_shot_schedule_request}}
- Pre-ready execution override: {{execution_override}}

# Acceptance

- {{acceptance_criterion}}

# Verification

- {{verification_requirement}}

## Verification contract

- Depth: `{{verification_depth}}` (`receipt-only` | `targeted` | `independent`)
- Claims must map to acceptance refs and required evidence.
- Integration gates must identify producer, consumer, expected version or contract, and the evidence that proves compatibility.

# Context pointers

- {{context_pointer}}

# Expected receipt

Return outcome, actual changes, worker validation, claim-evidence mapping, exact refs/versions/environments, commands or sources, results, observed_at, limitations/unverified gaps, deviations, open issues, and recovery information. The receipt reports `reported`; Lead verification decides whether the Task can become `verified`.
