# 变更日志

本文档记录 skill 集合中对使用者可见的变化。具体实施历史仍以 Git commit 和 Pull Request 为准。

## [0.3.0] - 2026-09-04

### Workstream

- 引入 context schema v2。Task lifecycle 成为唯一的当前执行状态；readiness、typed dependencies 和 typed blockers 作为相互独立的调度输入。
- 将可覆盖的 delivery receipt 改为按 Task、按执行尝试保存的 `AT-*` 记录。重试创建新的 attempt，不再改写旧证据。
- 新增 `RV-*` owner attention 队列，并区分 `inspect`、`advise` 和 `decide`。Review 不占用 WIP；只有 Task blocker 显式引用 active `decide` review 时，才会阻塞该 Task。
- 新增 evidence-first Lead verification，明确检查 acceptance 与 integration 覆盖。已有 worker evidence 充分时直接复用；只有声明的验证深度或升级信号要求时才独立复查。
- 新增派生的六段式 Lead closeout，固定展示 mode/WIP、backlog counts、hot Tasks、本轮变化、blockers 和 owner attention。
- 默认策略保持为 `capture + wip_limit: 4`。WIP 只统计 `scheduled`、`in_progress` 和 `reported` Task。
- 扩展 smoke corpus，覆盖 retry、blocked、superseded、accepted、owner attention、closeout 和迁移中断恢复场景。

### 迁移现有 Workstream

使用此版本新建或恢复 Workstream 时，Lead 应自动识别缺失或为 v1 的 `schema_version`、未完成的 migration marker 以及 legacy residue，并执行可重入的 v1→v2 context migration。迁移只修改协调记录：不得执行 backlog Task，也不得把历史 claim 当作新近验证过的 evidence。

变更日志只解释升级影响，不承担 migration contract。Canonical 规则位于 `skills/workstream/references/context-lifecycle.md`；AI 应加载并遵循该文件，而不是从本摘要自行推导迁移步骤。

新 Lead session 不需要迁移 prompt。对于可能仍持有旧版指令的长期 Lead session，升级后应新开 session，或发送下面这段一次性 prompt：

> 请重新加载当前安装的 `workstream` skill，并恢复 `<workstream-name>`。先只读检查 canonical context 的 `schema_version`、未完成 migration marker 和 legacy residue；如需升级，严格按 skill 的 Context migration 规则执行可重入的 v1→v2 迁移。迁移不得执行 backlog 中的业务 Task，也不得把历史 claim 自动视为已验证；遇到 source/target 内容冲突时停止覆盖并向我报告。完成后重建 `state.md` projection，并按新版六段 closeout 汇报迁移结果、未重新验证的历史 claims、active blockers 和 owner attention。
