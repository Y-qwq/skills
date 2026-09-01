# Context and lifecycle

## Root resolution

按以下顺序确定 workstreams root：

1. 用户或当前环境明确配置的路径；
2. `~/.agents/workstreams`；
3. 用户级目录不可用时，使用 anchor workspace 下的 `.agents/workstreams`，并将该选择记录在 `context.md`。

Skill 安装目录只存放 skill 定义和模板，不保存运行时 workstream。项目内目录也不是默认位置；只有用户明确要求 context 随项目管理，或用户级目录不可用时才使用。

Root 下直接存在的 workstream folder 即为 active，不增加 `active/` 层：

```text
workstreams/
├── <slug>/
│   ├── context.md
│   ├── state.md
│   ├── decisions.md
│   ├── tasks/
│   └── receipts/
└── archive/
    └── <slug>.md
```

Slug 应简短、稳定且在 root 内唯一。名称冲突时增加有意义的限定词或短 ID，不覆盖已有目录。

## Initialize

创建 workstream 时，从 `../assets/context/` 使用以下模板：

- [context.md](../assets/context/context.md)：稳定目标、scope、acceptance、workspace map、ownership 与用户策略；
- [state.md](../assets/context/state.md)：当前 task、live ref、integration checkpoint、recovery point 与 next action；
- [decisions.md](../assets/context/decisions.md)：会影响后续判断的 decision 及 supersession；
- [task.md](../assets/context/task.md)：复制为 `tasks/<task-id>.md`，作为派发 contract；
- [receipt.md](../assets/context/receipt.md)：复制为 `receipts/<task-id>.md`，记录实际结果与证据。

仅创建当前需要的 task 和 receipt。不要为理论上可能出现的角色预建空文件。

## Load and refresh

恢复 workstream 时：

1. 先读 `context.md` 和 `state.md`；
2. 只加载与当前请求相关的 decisions、tasks 和 receipts；
3. 对即将影响 action 的 branch、PR、issue、文件、接口、测试或部署状态重新查询权威来源；
4. 将过期 live ref 更新到 `state.md`，不要把瞬时状态复制进稳定 `context.md`；
5. 若 live authority 与 context 冲突，先判断 context 过期、实现漂移还是 scope 已改变，再更新 owner 对应的文件。

所有时间使用带时区的 ISO 8601。记录 observation 时间，避免后续把历史快照误当当前状态。

## Single writer

Lead 是共享 context 的唯一 writer。Worker 可以修改自己负责的目标产物，但只通过 receipt 返回 context update 建议。Lead 在验证后统一写入：

- scope 或 acceptance 变化 → `context.md`
- 当前执行状态或 live ref → `state.md`
- 稳定选择与理由 → `decisions.md`
- work item contract → `tasks/<task-id>.md`
- 已观察结果与证据 → `receipts/<task-id>.md`

若多个 lead 实例可能同时恢复同一 workstream，先用当前 harness 支持的 ownership 或协调机制确定单一 active writer。不要把同步目录中的普通 lock file 当作可靠的跨机器锁。

## Close and clean up

只有用户明确完成、取消或要求清理整个 workstream 时才关闭：

1. 刷新所有 delivery 和 verification 的当前状态；
2. 区分 completed、cancelled、superseded、open 和 unverified；
3. 将 outcome、重要 decisions、交付链接、验证、遗留事项与 recovery pointers 压缩到 `archive/<slug>.md`；
4. 回读 archive，确认它足以解释最终状态；
5. 删除 active `<slug>/` folder；
6. 向用户报告移除了什么，以及 archive 的位置。

Archive 是结案摘要，不复制完整流水账，也不声称未验证事项已经完成。
