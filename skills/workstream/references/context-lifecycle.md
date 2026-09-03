# Context and lifecycle

## Root resolution

按以下顺序确定 active context 的 owner 与 root：

1. 用户或项目明确声明的 `canonical context owner` 与 `active context root`；
2. 用户或当前环境明确配置的 workstreams root；
3. `~/.agents/workstreams`；
4. 用户级目录不可用时，使用 anchor workspace 下的 `.agents/workstreams`，并将该选择记录在 `context.md`。

显式 owner/root 是权威配置。只声明 owner 时，按项目提供的路径映射落位；不要根据 repo topology、仓库数量或“哪个仓库像终端”重新推断。一个跨 repo workstream 仍只使用一份 active context。

若 active context 位于 owner workspace 的 feature/integration branch，它只能随该 workstream branch 管理，不能进入 default、protected 或 release branch。完成前若该 branch 即将合并或删除，先把 active context 迁移到用户级 active root，并记录迁移前的 branch/ref 和恢复指针。最终 archive 默认写入用户级 `~/.agents/workstreams/archive`；如果用户显式指定了其它 archive root，按该配置执行。

Skill 安装目录只存放 skill 定义和模板，不保存运行时 workstream。项目内目录也不是默认位置；只有用户或项目明确要求 context 随项目管理，或用户级目录不可用时才使用。

Root 下直接存在的 workstream folder 即为 active，不增加 `active/` 层：

```text
workstreams/
├── <slug>/
│   ├── context.md
│   ├── state.md
│   ├── decisions.md
│   ├── history.md
│   ├── tasks/
│   └── receipts/
└── archive/
    └── <slug>.md
```

当 active context 在项目/owner workspace 时，`archive/` 仍以用户级 archive 为目标；不要在每个 repo 建一份 archive 或复制状态。

Slug 应简短、稳定且在 root 内唯一。名称冲突时增加有意义的限定词或短 ID，不覆盖已有目录。

## Initialize

创建 workstream 时，从 `../assets/context/` 使用以下模板：

- [context.md](../assets/context/context.md)：稳定目标、scope、acceptance、workspace map、ownership 与用户策略；
- [state.md](../assets/context/state.md)：当前 execution mode、backlog counts、hot tasks、candidate tasks、live ref、integration checkpoint、recovery point 与 next action；
- [decisions.md](../assets/context/decisions.md)：会影响后续判断的 decision 及 supersession；
- [history.md](../assets/context/history.md)：已验证 Task/milestone 的紧凑历史、delivery、verification 与唯一证据/恢复指针；
- [task.md](../assets/context/task.md)：复制为 `tasks/<task-id>.md`，作为派发 contract；
- [receipt.md](../assets/context/receipt.md)：复制为 `receipts/<task-id>.md`，记录实际结果与证据。

仅创建当前需要的 task 和 receipt。不要为理论上可能出现的角色预建空文件；长期 backlog Task 可以先以 `unready` 或 `pre-ready` + `backlog` 存在，但普通对话不单独建 Task。

## Load and refresh

恢复 workstream 时：

1. 先读 `context.md` 和 `state.md`；
2. 将 `tasks/*.md` 视为 open backlog 的 canonical board；按当前请求加载相关 Task、decision 和 receipt。`state.md` 只是 counts、hot tasks 和候选项的投影，不要求列出全部 unready/pre-ready backlog；
3. 读取 `history.md` 以恢复已验证结论和唯一 evidence/recovery pointer；
4. 对即将影响 action 的 branch、PR、issue、文件、接口、测试或部署状态重新查询权威来源；
5. 将过期 live ref、当前 execution mode 和 WIP 更新到 `state.md`，不要把瞬时状态复制进稳定 `context.md`；
6. 若 live authority 与 context 冲突，先判断 context 过期、实现漂移还是 scope 已改变，再更新 owner 对应的文件。

所有时间使用带时区的 ISO 8601。记录 observation 时间，避免后续把历史快照误当当前状态。

## Single writer

Lead 是共享 context 的唯一 writer。Worker 可以修改自己负责的目标产物，但只通过 receipt 返回 context update 建议。Lead 在验证后统一写入：

- scope 或 acceptance 变化 → `context.md`
- 当前 execution mode、WIP、backlog projection 或 live ref → `state.md`
- 稳定选择与理由 → `decisions.md`
- open work item contract 与 readiness/lifecycle → `tasks/<task-id>.md`
- 已观察结果与证据 → `receipts/<task-id>.md`
- 已验证 Task 的压缩索引与唯一 evidence/recovery pointer → `history.md`

若多个 lead 实例可能同时恢复同一 workstream，先用当前 harness 支持的 ownership 或协调机制确定单一 active writer。不要把同步目录中的普通 lock file 当作可靠的跨机器锁。

## Close and clean up

只有用户明确完成、取消或要求清理整个 workstream 时才关闭：

1. 刷新所有 delivery 和 verification 的当前状态；
2. 区分 verified、reported、cancelled、superseded、open backlog 和 unverified；
3. 将 outcome、重要 decisions、交付链接、验证、遗留事项与 recovery pointers 压缩到用户级 `archive/<slug>.md`；
4. 回读 archive，确认它足以解释最终状态；
5. 删除 active `<slug>/` folder；
6. 向用户报告移除了什么，以及 archive 的位置。

Archive 是结案摘要，不复制完整流水账，也不声称未验证事项已经完成。

## Verified compaction

Task 进入 `verified` 后，lead 先把稳定结论提升到 `context.md`、`decisions.md` 或项目权威 artifact，再在 `history.md` 写入 outcome、delivery、verification、`closed_at` 和唯一证据/恢复指针。相邻、同 owner、没有独立恢复价值的已验证微任务可以合并为 milestone，并保留原 Task IDs。随后从 `state.md` 的 hot tasks 和 candidate projection 移除，并删除或移出详细 task/receipt 热区。若 receipt 含有无法从 history 或权威 artifact 重建的证据，保留在明确的历史路径并由 `history.md` 指向；不要让它继续作为 current state。

这一步只压缩已验证的 work item，不关闭 workstream；open backlog、未验证结果和 blocker 仍留在 active context 中。

## Context migration

若 owner workspace 的 active branch 会提前合并或删除：

迁移是 move 而不是只复制一份：

1. 在 branch 消失前读取并校验 `context.md`、`state.md`、`decisions.md`、`history.md` 以及未验证的 task/receipt，记录 source branch、merge-base 和 active folder 的文件清单/版本；
2. 把整份 active folder 写入用户级 active root，保持 slug 和唯一 writer，并对比 source/destination 的文件清单和内容；
3. 从 source branch 的 mergeable tree 删除 active folder（不是只在目标处复制），在 source branch 仍可写时提交该删除，记录 deletion commit/ref 和验证结果；
4. 针对实际的 default、protected、release target 重新计算最终 diff，确认不包含 active context 路径；不要只检查工作区状态或依赖旧 branch 名称；
5. 在新的 `context.md` 与 `state.md` 记录 `context_owner`、旧 branch/ref、迁移时间、deletion commit 和 recovery pointer；
6. 继续使用迁移后的 folder，直到用户明确关闭 workstream。

若 source branch 已经合并或删除，先从仍被 PR、保留 clone、backup ref 或其它实际对象持有的 source tree 恢复；检查其 mergeable/final diff 是否带入 active context。若带入，建立并完成清理变更后才能宣称迁移完成；只有 SHA 文本而没有保留对象时，不能声称 source tree 已恢复或删除已验证。
