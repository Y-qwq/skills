---
workstream_id: "{{workstream_id}}"
updated_at: "{{updated_at}}"
---

# History

已验证或终止的 Task 在从 active context 压缩后，保留一条足以恢复判断的记录。相邻、同 owner 且没有独立恢复价值的微任务可以合并为一个 milestone，并在 Included tasks 中保留原始 ID。不要把完整流水账复制到这里。

| Task or milestone | Included tasks | Readiness | Lifecycle | Outcome | Delivery | Verification depth | closed_at | Evidence or recovery pointer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| {{task_or_milestone}} | {{included_task_ids}} | {{readiness}} | {{lifecycle}} | {{outcome}} | {{delivery}} | {{verification_depth}} | {{closed_at}} | {{evidence_or_recovery_pointer}} |

## Retained evidence

- {{retained_evidence_or_recovery_pointer}}

## Compaction notes

- Stable conclusions promoted to: {{promoted_context_or_artifact}}
- Removed from active/hot state: {{removed_hot_files_or_tasks}}
- Remaining unverified or open work: {{remaining_open_work}}
