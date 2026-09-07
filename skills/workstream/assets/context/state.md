---
schema_version: 2
workstream_id: "{{workstream_id}}"
updated_at: "{{updated_at}}"
execution_mode: capture
wip_limit: 4
pre_ready_policy: explicit_only
default_verification_depth: targeted
run:
  status: idle
  stop_reason: null
  resume_condition: owner-request
  stop_verification: null
  no_progress_cycles: 0
  last_notice: null
  budget: null
---

# Current status

{{current_status}}

Frontmatter 是执行控制的唯一来源，包括 Run gate；重建正文时不能覆盖它。正文由 Task、receipt、review 和 live authority 派生。Run 控制不是 session status；语义与恢复规则见 `references/run-control.md`。

# Scheduling projection

- Read mode, WIP limit, pre-ready policy and default verification depth from frontmatter; do not duplicate their current values here.
- WIP count: {{wip_count}} (`scheduled` + `in_progress` + `reported`)
- WIP excludes: `backlog`, `verified`, `cancelled`, `superseded`
- Runnable is derived from current lifecycle, valid active blockers, dependencies, frontmatter controls and explicit overrides; do not persist it.

# Backlog counts

| Readiness | Backlog count | Known blocked count |
| --- | --- | --- |
| ready | {{ready_backlog_count}} | {{ready_blocked_count}} |
| pre-ready | {{pre_ready_backlog_count}} | {{pre_ready_blocked_count}} |
| unready | {{unready_backlog_count}} | {{unready_blocked_count}} |

# Scheduled/in-progress/reported hot tasks

| Task | Readiness | Lifecycle | Priority | Owner | Active blockers | Execution target | Workspace | Delivery |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| {{hot_task_id}} | {{hot_task_readiness}} | {{hot_task_lifecycle}} | {{hot_task_priority}} | {{hot_task_owner}} | {{hot_task_blockers}} | {{hot_task_execution_target}} | {{hot_task_workspace}} | {{hot_task_delivery}} |

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

# Owner attention (derived)

Review records are an attention queue, not an approval gate. Build this section by reading `reviews/*.md` and reverse-indexing active `tasks/*.md` frontmatter `blockers[].ref` values. Count only blockers that target a `queued` or `presented` `intent: decide` review; other review references are schema errors to report and repair. A review's existence or unresolved state never blocks work by itself, and reviews never count toward WIP.

| Review | Intent | Status | Related tasks | Blocking tasks (derived) | Reading cost | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| {{review_id}} | {{review_intent}} | {{review_status}} | {{review_related_tasks}} | {{review_blocking_tasks}} | {{review_reading_cost}} | {{review_recommendation}} |

# Lead closeout view

仅在有实质变化、需要决定或用户查询时输出；日常只报增量，里程碑/完整查询展示 mode/WIP、backlog、hot tasks、变化、blockers 和 owner attention。暂停提示按 run.last_notice 去重；无变化不生成重复看板。

# Next actions

1. {{next_action}}
