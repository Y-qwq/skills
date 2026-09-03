---
workstream_id: "{{workstream_id}}"
updated_at: "{{updated_at}}"
execution_mode: capture
wip_limit: "{{wip_limit}}"
pre_ready_policy: explicit_only
---

# Current status

{{current_status}}

# Scheduling policy

- Mode: `{{execution_mode}}`
- WIP limit: {{wip_limit}}
- Pre-ready policy: `{{pre_ready_policy}}`
- Runnable is derived from current lifecycle, blocker, dependencies, mode and explicit overrides; do not persist it.

# Backlog counts

| Readiness | Backlog count | Known blocked count |
| --- | --- | --- |
| ready | {{ready_backlog_count}} | {{ready_blocked_count}} |
| pre-ready | {{pre_ready_backlog_count}} | {{pre_ready_blocked_count}} |
| unready | {{unready_backlog_count}} | {{unready_blocked_count}} |

# Scheduled/in-progress/reported hot tasks

| Task | Readiness | Lifecycle | Priority | Owner | Blocked by | Execution target | Workspace | Delivery |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| {{hot_task_id}} | {{hot_task_readiness}} | {{hot_task_lifecycle}} | {{hot_task_priority}} | {{hot_task_owner}} | {{hot_task_blocked_by}} | {{hot_task_execution_target}} | {{hot_task_workspace}} | {{hot_task_delivery}} |

# Next dispatch candidates

| Task | Readiness | Priority | Dependencies | One-shot request | Why runnable or waiting |
| --- | --- | --- | --- | --- | --- |
| {{candidate_task_id}} | {{candidate_readiness}} | {{candidate_priority}} | {{candidate_dependencies}} | {{candidate_one_shot_request}} | {{candidate_reason}} |

# Integration checkpoints

- {{integration_checkpoint}}

# Live references

| Target | Ref or version | Observed at | Source |
| --- | --- | --- | --- |
| {{target}} | {{ref_or_version}} | {{observed_at}} | {{source}} |

# Recovery points

- {{recovery_point}}

# Key blockers

- {{key_blocker}}

# Next actions

1. {{next_action}}
