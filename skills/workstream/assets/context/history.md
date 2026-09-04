---
schema_version: 2
workstream_id: "{{workstream_id}}"
updated_at: "{{updated_at}}"
---

# History

已验证或终止的 Task 在从 active context 压缩后，保留一条足以恢复判断的记录。相邻、同 owner 且没有独立恢复价值的微任务可以合并为一个 milestone，并在 Included tasks 中保留原始 ID。不要把完整流水账复制到这里。

| Task or milestone | Included tasks | Readiness | Lifecycle | Outcome | Delivery | Effective verification depth | closed_at | Evidence or recovery pointer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| {{task_or_milestone}} | {{included_task_ids}} | {{readiness}} | {{lifecycle}} | {{outcome}} | {{delivery}} | {{effective_verification_depth}} | {{closed_at}} | {{evidence_or_recovery_pointer}} |

# Owner attention history

终结的 review 只保留足以恢复 owner-facing 决定或已展示 artifact 的紧凑记录；未终结 review 继续留在 `reviews/`。

| Review | Intent | Terminal status | Outcome or decision | Related tasks | closed_at | Evidence or recovery pointer |
| --- | --- | --- | --- | --- | --- | --- |
| {{review_id}} | {{review_intent}} | {{review_terminal_status}} | {{review_outcome_or_decision}} | {{review_related_tasks}} | {{review_closed_at}} | {{review_evidence_or_recovery_pointer}} |

## Retained evidence

- {{retained_evidence_or_recovery_pointer}}

## Compaction notes

- Stable conclusions promoted to: {{promoted_context_or_artifact}}
- Removed from active/hot state: {{removed_hot_files_or_tasks}}
- Remaining unverified or open work: {{remaining_open_work}}

保留的 evidence/recovery pointer 应指向具体 attempt，例如 `receipts/T-001/AT-001.md` 或 `receipts/T-001/AT-002.md`；不要把旧 attempt 覆盖成当前 receipt。只有未终结 attention 可以指向 active `reviews/RV-*.md`。Terminal review 的 history row 应直接保留必要 outcome，或指向已提升的 `decisions.md`、`context.md` 或外部 durable artifact，不能指向已经移除的 active review path。
