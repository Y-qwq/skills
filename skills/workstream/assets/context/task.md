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

# Context pointers

- {{context_pointer}}

# Expected receipt

Return outcome, actual changes, validation evidence, refs or artifacts, deviations, open issues, and recovery information.
