# Context and lifecycle

## Schema and canonical layout

Active context uses `schema_version: 2`. One workstream has one canonical context folder; its runtime layout is:

```text
workstreams/
└── <slug>/
    ├── context.md
    ├── state.md
    ├── decisions.md
    ├── history.md
    ├── tasks/
    │   └── <task-id>.md
    ├── receipts/
    │   └── <task-id>/
    │       ├── AT-001.md
    │       └── AT-002.md
    └── reviews/
        └── RV-001.md
```

The folders have one responsibility each:

- `context.md` is the durable outcome, scope, stable workstream acceptance (`WAC-001`, `WAC-002`, ...), workspace map, ownership and user policy. Task-local acceptance uses `AC-*`; outside a Task/receipt it is addressed as the composite `task:<task-id>#AC-001`.
- `tasks/*.md` is the canonical open Task board. A Task's `lifecycle` is the only current execution truth. Its `dependencies` and active `blockers` are typed frontmatter, and `runnable` is derived rather than stored.
- `receipts/<task-id>/<attempt-id>.md` preserves one execution attempt. Attempt IDs are `AT-001`, `AT-002`, ...; a retry creates a new file and never overwrites an earlier attempt. Worker evidence is sealed when the Lead records `reported`; only `lead_verification` may then change, and the whole record is finalized after a non-pending decision.
- `reviews/*.md` is the owner-facing attention queue. Review IDs are `RV-001`, `RV-002`, ...; review status and Task lifecycle are independent.
- `state.md` is a rebuildable dashboard/projection of Task and review records. It is not a second board and does not persist a Lead work-cycle or session status.
- `decisions.md` stores stable choices and supersession; `history.md` stores compacted terminal work and unique evidence/recovery pointers.

## Root resolution

按以下顺序确定 active context 的 owner 与 root：

1. 用户或项目明确声明的 `canonical context owner` 与 `active context root`；
2. 用户或当前环境明确配置的 workstreams root；
3. `~/.agents/workstreams`；
4. 用户级目录不可用时，使用 anchor workspace 下的 `.agents/workstreams`，并将该选择记录在 `context.md`。

显式 owner/root 是权威配置。只声明 owner 时，按项目提供的路径映射落位；不要根据 repo topology、仓库数量或“哪个仓库像终端”重新推断。一个跨 repo workstream 仍只使用一份 active context。

若 active context 位于 owner workspace 的 feature/integration branch，它只能随该 workstream branch 管理，不能进入 default、protected 或 release branch。完成前若该 branch 即将合并或删除，先把 active folder 迁移到用户级 active root，并记录迁移前的 branch/ref 和恢复指针。最终 archive 默认写入用户级 `~/.agents/workstreams/archive`；如果用户显式指定了其它 archive root，按该配置执行。

Root 下直接存在的 workstream folder 即为 active，不增加 `active/` 层。Slug 应简短、稳定且在 root 内唯一；名称冲突时增加有意义的限定词或短 ID，不覆盖已有目录。

## Initialize

创建 workstream 时，从 `../assets/context/` 使用模板：

- `context.md`、`state.md`、`decisions.md`、`history.md`；
- `task.md` 复制为 `tasks/<task-id>.md`；
- `receipt.md` 复制为 `receipts/<task-id>/<attempt-id>.md`，首次通常为 `AT-001`；
- `review.md` 复制为 `reviews/<review-id>.md`，仅在有明确 owner-facing artifact、建议或决定问题时创建。

仅创建当前需要的 Task、attempt receipt 和 review。不要为理论上可能出现的角色预建空文件；长期 backlog Task 可以先以 `unready` 或 `pre-ready` + `backlog` 存在，普通对话不单独建 Task。

## Load and refresh

恢复 workstream 时：

1. 先读 `context.md` 和 `state.md`，确认 `schema_version`；
2. 将 `tasks/*.md` 视为 open backlog 的 canonical board，按当前请求加载相关 Task、decision、attempt receipt 和 review；
3. 读取 `history.md` 以恢复已验证结论和唯一 evidence/recovery pointer；
4. 对即将影响 action 的 branch、PR、issue、文件、接口、测试或部署状态重新查询权威来源；
5. 由 Task、attempt 和 review records 重建 `state.md` 的 counts、hot tasks、候选项、WIP 和 owner attention；不要把 projection 当成第二份事实；
6. 若 live authority 与 context 冲突，先判断 context 过期、实现漂移还是 scope 已改变，再更新 owner 对应的文件。

所有时间使用带时区的 ISO 8601。记录 observation 时间，避免后续把历史快照误当当前状态。

## Single writer

Lead 是共享 context 的唯一 writer。Worker 可以修改自己负责的目标产物，但只返回当前 attempt payload 与 context update 建议。Lead 在 evidence-first verification 与 lifecycle decision 后统一写入：

- scope、workstream acceptance 或稳定策略 → `context.md`；
- 当前 execution mode、WIP、backlog projection、hot tasks 或 owner attention projection → `state.md`；
- 稳定选择与理由 → `decisions.md`；
- open Task contract、readiness、lifecycle、typed dependencies/blockers 与 `current_attempt_id` → `tasks/<task-id>.md`；
- Worker 返回的执行观察与 Lead decision evidence → 由 Lead 写入 `receipts/<task-id>/<attempt-id>.md`；
- 尚未终结的 owner-facing attention → `reviews/<review-id>.md`；
- 已验证或终止 Task、已终结 review 的紧凑索引与唯一 evidence/recovery pointer → `history.md`。

不要让多个 worker 并发写 `context.md`、`state.md`、`decisions.md`、Task 或 review records。若多个 Lead 实例可能恢复同一 workstream，先用当前 harness 支持的 ownership 或协调机制确定单一 active writer；普通 lock file 不是可靠的跨机器锁。

## Owner review lifecycle and compaction

Review 是注意力队列，不是默认审批队列。它有独立的 `intent` 和 `status`：

- `intent: inspect`：内容已在 closeout 中完整展示时，Lead 可当轮标记 `resolved`，不需要 owner acknowledgement；若只展示索引则保持 `presented`，等待 owner 点选阅读。
- `intent: advise`：Lead 可以依据已记录的可逆 default assumption 继续；当反馈失去意义时标记 `resolved`、`waived` 或 `superseded`。
- `intent: decide`：等待 owner 决定，但只阻塞显式引用该 review 的 Task。只有 `queued` 或 `presented` 的 active `decide` review 可被引用为 blocker。

Review 的 `related_tasks` 和 `context_refs` 只是关联信息。不要在 review 中维护 canonical `blocks` 字段；blocking scope 由 Lead 反向扫描 Task `blockers[].ref: review:RV-*` 得出。引用 `inspect`、`advise` 或 terminal review 的 blocker 是 schema error，不参与 runnable 判断；若确实需要 owner 决定，先把 review 转为 active `decide` 并记录原因。Review 存在、处于 `queued`、`presented` 或 unresolved 都不会自动阻塞，也不计入 WIP。

active `reviews/*.md` 只保留未终结的 attention。`resolved`、`waived`、`superseded` 后，将稳定决定提升到 `decisions.md` 或 `context.md`，在 `history.md` 保留精简 review outcome 与必要 pointer，再移出 active queue。Review 可以跨 Task compaction 存活；Task 进入 `verified` 不得自动删除仍未终结的 review。

## Close and clean up

只有用户明确完成、取消或要求清理整个 workstream 时才关闭：

1. 刷新所有 delivery、Task lifecycle、attempt evidence 和 owner review 的当前状态；
2. 区分 `verified`、`reported`、`cancelled`、`superseded`、open backlog、active blockers 与未验证事项；
3. 将 outcome、重要 decisions、交付链接、验证、遗留事项、review outcome 与 recovery pointers 压缩到用户级 `archive/<slug>.md`；
4. 回读 archive，确认它足以解释最终状态；
5. 删除 active `<slug>/` folder；
6. 向用户报告移除了什么，以及 archive 的位置。

Archive 是结案摘要，不复制完整流水账，也不声称未验证事项已经完成。

## Verified compaction

Task 进入 `verified` 后，Lead 先把稳定结论提升到 `context.md`、`decisions.md` 或项目权威 artifact，再在 `history.md` 写入 outcome、delivery、effective verification depth、`closed_at` 和具体 attempt 的 evidence/recovery pointer（例如 `receipts/T-001/AT-002.md`）。相邻、同 owner、没有独立恢复价值的已验证微任务可以合并为 milestone，但保留原 Task IDs。随后从 `state.md` 的 hot tasks 和 candidate projection 移除，并删除或移出详细 Task/receipt 热区；无法重建的证据保留在明确的历史路径并由 history 指向。

这一步只压缩已验证或终止的 work item，不关闭 workstream；open backlog、未验证结果、active blocker 和未终结 review 仍留在 active context 中。

## Context migration

只要 `schema_version` 缺失/为 `1`、`schema_migration.target_version: 2` 尚未完成，或仍检测到 legacy receipt 路径/字段，就按未完成的 v1→v2 migration 处理。迁移只改变 context schema，不执行任何业务 Task，也不把历史声明自动升级为当前验证结论。

迁移必须可安全重入，并把 `schema_version: 2` 作为最后的 commit marker：

1. 先只读扫描 context、state、Task、receipt、history，形成旧路径→目标路径、acceptance ID、dependency/blocker 字段和 verification 字段的确定性 mapping；在 `context.md` 记录 `schema_migration: {target_version: 2, status: in_progress, checkpoint: <pointer>}`，此时不要写 `schema_version: 2`；
2. 按 mapping 逐项转换。Task-local acceptance 分配稳定 `AC-*`，workstream acceptance 使用 `WAC-*`；receipt claims 同步引用对应 Task 的 `AC-*`；
3. 迁移旧 `receipts/<task-id>.md` 时：目标不存在才创建 `receipts/<task-id>/AT-001.md`；若 source 已不存在且目标与 checkpoint 一致，视为该步已完成；若 source 和目标都存在且内容/identity 等价，校验后只保留目标；若内容冲突，绝不覆盖，记录 `status: blocked` 并向 owner 报告；
4. 将旧 `depends_on` 转为 typed `dependencies`，将旧 `blocked_by` 转为 typed `blockers`，并移除正文中的重复真相；把旧 `lead_verification.status` 转为 decision fields，但不改变历史 evidence；
5. 根据 Task、attempt 和 review records 重建 `state.md` projection、WIP 与 owner attention。没有明确用户可阅 artifact、建议或决定问题时，不自动创建 review；
6. 验证所有旧路径/legacy 字段已清理、每个 `acceptance_refs` 都能在对应 `task_id` 下解析、Attempt/Review ID 唯一、projection 可重建，并在 history 或 migration decision 中记录 mapping、未重新验证 claims 和 recovery pointer；
7. 所有检查通过后，最后写入 `schema_version: 2`，并将 `schema_migration.status` 设为 `completed`、记录 `completed_at`。恢复时即使已看到 version 2，只要 marker 未完成或 legacy residue 仍存在，也必须继续/阻塞迁移，不能直接开始业务 Task。

若 active context 位于 owner workspace 的 branch，迁移与 branch 清理仍遵循以下 move 规则：

1. 在 branch 消失前读取并校验整个 active folder，记录 source branch/ref、merge-base 和文件清单；
2. 将整份 active folder move 到用户级 active root，保持 slug 和唯一 writer，并对比 source/destination 的文件清单和内容；
3. 从 source branch 的 mergeable tree 删除 active folder，在 source branch 仍可写时提交该删除，记录 deletion commit/ref 和验证结果；
4. 针对实际 default、protected、release target 重新计算最终 diff，确认不包含 active context 路径；
5. 在新的 `context.md` 与 `state.md` 记录 owner、旧 branch/ref、迁移时间、deletion commit 和 recovery pointer；
6. 继续使用迁移后的 folder，直到用户明确关闭 workstream。

若 source branch 已合并或删除，先从仍被 PR、保留 clone、backup ref 或其它实际对象持有的 source tree 恢复；只有 SHA 文本而没有保留对象时，不能声称 source tree 已恢复或删除已验证。
