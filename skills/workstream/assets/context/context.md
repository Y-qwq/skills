---
schema_version: 2
id: "{{workstream_id}}"
name: "{{workstream_name}}"
status: active
created_at: "{{created_at}}"
updated_at: "{{updated_at}}"
workstreams_root: "{{workstreams_root}}"
context_owner: "{{context_owner}}"
active_context_root: "{{active_context_root}}"
active_branch_or_ref: "{{active_branch_or_ref}}"
archive_root: "{{archive_root}}"
default_execution_mode: capture
default_wip_limit: 4
default_verification_depth: targeted
pre_ready_policy: explicit_only
---

# Outcome

{{desired_outcome}}

# Scope

## Included

- {{included_scope}}

## Excluded

- {{excluded_scope}}

# Workstream acceptance

- WAC-001: {{acceptance_criterion}}

# Workspace map

| Workspace | Path or locator | Responsibility | Authority source |
| --- | --- | --- | --- |
| {{workspace}} | {{path_or_locator}} | {{responsibility}} | {{authority_source}} |

# Ownership and interfaces

- {{ownership_or_interface}}

# User policies

- {{user_policy}}

# Schema and runtime layout

- Schema version: `2`
- Canonical open Task records: `tasks/<task-id>.md`
- Preserved execution attempt records: `receipts/<task-id>/<attempt-id>.md`, where attempt IDs use `AT-001`, `AT-002`, ...
- Owner-facing attention records: `reviews/<review-id>.md`, where review IDs use `RV-001`, `RV-002`, ...
- Workstream acceptance IDs use `WAC-001`, `WAC-002`, ... . Task-local acceptance IDs use `AC-001`, `AC-002`, ... and are identified together with their Task ID; an attempt receipt's `task_id` supplies that Task scope.
- `state.md` is a rebuildable projection. Task lifecycle, active typed blockers, attempt receipts, and review records are the sources of truth described in the schema references.

# Canonical controls and placement

Execution defaults, pre-ready policy, context owner, active root/ref and archive root are canonical in frontmatter. Read and update them there; do not duplicate their current values in the body.

# Durable context sources

- {{context_source}}

# Open questions

- {{open_question}}
