---
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
default_wip_limit: "{{default_wip_limit}}"
pre_ready_policy: explicit_only
---

# Outcome

{{desired_outcome}}

# Scope

## Included

- {{included_scope}}

## Excluded

- {{excluded_scope}}

# Acceptance

- {{acceptance_criterion}}

# Workspace map

| Workspace | Path or locator | Responsibility | Authority source |
| --- | --- | --- | --- |
| {{workspace}} | {{path_or_locator}} | {{responsibility}} | {{authority_source}} |

# Ownership and interfaces

- {{ownership_or_interface}}

# User policies

- {{user_policy}}

# Execution defaults and policies

- Default execution mode: `{{default_execution_mode}}`
- Default WIP limit: {{default_wip_limit}}
- Pre-ready policy: `{{pre_ready_policy}}`
- Context owner: {{context_owner}}
- Active context root: {{active_context_root}}
- Active branch or ref: {{active_branch_or_ref}}
- Archive root: {{archive_root}}

# Durable context sources

- {{context_source}}

# Open questions

- {{open_question}}
