---
name: workstream
description: >
  Lead a long-running body of work from natural-language requests by maintaining a durable backlog,
  coordinating dependent work across repositories or specialties, scheduling available workers,
  verifying integrated outcomes, and reporting concise progress. Use when one accountable lead should
  manage a multi-step or multi-party effort over time. Not for a single self-contained task that does
  not need persistent coordination.
---

# Workstream

为需要持续协调的工作建立一个负责到底的 lead。用户只需要描述目标或变更；lead 负责理解已有 context、识别影响面、持续维护 backlog、按策略排期执行、校验集成结果，并维护可恢复的长期状态。

不要因为任务包含多个步骤就自动创建 workstream。若一个任务能够在当前上下文内直接完成，不需要跨任务协调或长期恢复，直接执行即可。

默认是 backlog-first：收到用户的新想法、目标或变更时，先捕获或更新 Task，不自动派发或执行。默认策略是 `capture + wip_limit: 4`；WIP 只统计 `scheduled`、`in_progress` 和 `reported`，不统计 `backlog`、`verified`、`cancelled` 或 `superseded`。因此 capture 不会因为还有容量而自动开工，WIP 4 只在 owner 明确排期或切换到其它 execution mode 时限制在制数量。`capture` 仍允许 owner 明确点名某个 Task 发出一次性“执行/排期”请求；ready Task 可据此排期，pre-ready 还必须在同一请求中接受不确定性并限定受控范围，unready 原 Task 不执行。其它调度规则见 [references/task-lifecycle-and-scheduling.md](references/task-lifecycle-and-scheduling.md)。

运行时 context 使用 `schema_version: 2`：`tasks/*.md` 是唯一的 open Task board，`receipts/<task-id>/<attempt-id>.md` 是不可覆盖的 `AT-*` attempt evidence，`reviews/<review-id>.md` 是 `RV-*` owner attention queue，`state.md` 只是从这些记录重建的 projection。Task acceptance 使用稳定的 `AC-*` ID；Task lifecycle 是唯一当前 execution truth，Lead verification 只记录 attempt 的 decision/evidence。

## Start or resume

1. 先解析用户或项目显式声明的 canonical context owner/root；其次使用显式 workstreams root，再默认使用 `~/.agents/workstreams`。不要根据 repo topology 重新推断 owner，也不要为同一项工作创建多个目录。
2. 按名称、目标、workspace 与已有 context 判断是恢复现有 workstream，还是创建新的唯一 slug。
3. 首次进入、恢复、调度、迁移或改变生命周期时，读取 [references/context-lifecycle.md](references/context-lifecycle.md)；涉及 Task readiness、lifecycle、attempt、review 或执行策略时读取 [references/task-lifecycle-and-scheduling.md](references/task-lifecycle-and-scheduling.md)。
4. 加载最小充分 context，并从代码、仓库、任务系统或其它权威来源刷新即将影响决策的当前事实。Context 是协调缓存，不是当前事实的替代品。
5. 将用户请求转化为 outcome、scope、带 `AC-*` 的 acceptance、typed dependencies/blockers、readiness 与待验证假设。默认只写入 backlog；若用户明确点名 Task 执行/排期，记录 one-shot schedule request 并按 runnable predicate 判断；只有缺失信息会实质改变目标、权限或外部影响时才询问用户。

## Lead loop

对每次请求执行同一个闭环：

1. **Orient**：读取 workstream context，刷新相关 live state，确认用户的新请求如何改变当前目标。
2. **Capture and shape**：只为独立、可调度或需要长期跟踪的工作单元创建 Task；补齐 scope、acceptance、依赖、readiness 与 blocker。普通对话、context 写回和 delivery 动作写入已有记录，不单独建 Task。
3. **Schedule**：根据 state 中的 execution mode、WIP、依赖、共享写入面和 readiness 派发可运行 Task；capture mode 不自动派发，但可响应单个 Task 的 one-shot schedule request。需要派发时读取 [references/delegation-and-coordination.md](references/delegation-and-coordination.md)。
4. **Supervise**：跟进阻塞、回答 context 内可解决的问题，并在依赖或 scope 变化时主动调整其它 work item。
5. **Integrate**：先按 [references/delegation-and-coordination.md](references/delegation-and-coordination.md) 执行 evidence-first、incremental 的 Lead verification：审计当前 attempt receipt 证据与 ref 的绑定、acceptance 覆盖和跨 Task 集成；没有风险信号时不要重复 worker 已完成的调查或验证。Lead 在 receipt 中记录 decision/evidence，并同步更新 Task 的唯一 lifecycle：`verified`、退回 `backlog` 重试/加 blocker、`cancelled` 或 `superseded`。
6. **Record and compact**：由 Lead 更新共享 context、decision、Task、attempt receipt 和 owner review；将已验证 Task 的稳定结论提升到权威 context 或 artifact，并按规则压缩热区。未终结 review 不因相关 Task verified 自动删除。
7. **Report**：每轮 Lead work cycle 完成后派生 closeout，固定展示 mode/WIP、backlog counts、hot tasks、this-turn changes、Task blockers 和 owner attention；不要持久化 session status，也不要复述操作流水账。

需要派发、并行或协调共享代码时，读取 [references/delegation-and-coordination.md](references/delegation-and-coordination.md)。

## Execution fallback

根据当前 harness 提供的能力，依次选择最合适的隔离方式：

1. 独立 session 或 task，适合需要长期可见、可单独跟进的 work item；
2. subagent 或等价 worker，适合当前 lead 内部的有界执行；
3. lead inline 执行。

某一种能力不可用时自动降级到下一种，不要仅因缺少独立 session 而停下。选择执行方式时仍需遵守当前 harness、用户 scope 与仓库规则。

worker 只消费已排期的 Task packet，先在自己负责的范围内完成 worker validation，再返回新的结构化 `AT-*` attempt payload，由 Lead 写入 canonical receipt；不得把 session 的完成状态直接当成 Task 的 `verified`。Receipt 必须逐项映射 claim、`AC-*` acceptance 和 evidence；Lead verification 是独立的集成与证据判断，不是重复执行 worker 的默认理由。失败或 blocked 的 receipt 由 Lead 决定 retry、增加 typed blocker、cancel 或 supersede。详细协议见 [references/delegation-and-coordination.md](references/delegation-and-coordination.md)。

## Authority and mutations

可执行范围由用户授权、当前 harness 权限和目标系统规则共同决定。Harness 权限是能力边界，不自动证明用户意图；本 skill 也不发明额外的 blanket ban。

在执行 push、merge、发布、历史改写、共享状态覆盖或其它有后果的操作前，读取 [references/delivery-and-recovery.md](references/delivery-and-recovery.md)。当权限、ownership、并发影响、下游影响或恢复能力存在实质不确定性时再升级给用户。

## Context ownership

每个 workstream 只有 lead 写入共享 context。Worker 读取 task packet 和必要 context，返回结构化 attempt payload；不要让多个 worker 直接并发修改 canonical receipt、`context.md`、`state.md`、`decisions.md`、Task 或 review records。

Owner review 是非阻塞的 attention queue，不是默认审批 gate。Review 使用 `intent: inspect | advise | decide` 与 `status: queued | presented | resolved | waived | superseded`；只有某个 Task 的 typed `blockers` 显式引用 active `decide` review 时才阻塞该 Task，引用 `inspect`、`advise` 或 terminal review 是 schema error，review 的 `related_tasks` 也不是 blocker。每轮 closeout 展示新 queued 内容：少量内容直接展示，较多内容展示索引/阅读成本/推荐顺序并让 owner 点选；blocking decide 突出，presented 的 non-blocking review 压缩呈现。详见 [references/delegation-and-coordination.md](references/delegation-and-coordination.md)。

一个跨 repo workstream 仍只有一个 canonical context folder。不要在每个 repo 复制一份状态。不要在 context 中保存 secret、token、进程锁、临时 session handle 或其它机器级瞬时数据。

若用户或项目声明了 context owner/root，声明即为权威；active context 可以随指定的 workstream feature/integration branch 管理，但不得进入 default、protected 或 release branch。若该 branch 在 workstream 完成前合并或删除，不是只复制 context：先迁移并校验 active folder，再从 source branch 的 mergeable tree 删除并提交，确认面向受保护目标的最终 diff 不含 active context。整个 workstream 完成后将摘要归档到用户级 archive 并删除 active context。详细规则见 [references/context-lifecycle.md](references/context-lifecycle.md)。

## Completion

Work item 完成不等于 workstream 完成。持续维护 active context 和未执行 backlog，直到用户明确表示整个 workstream 已完成、取消或需要清理。

收到明确完成指令后，先验证交付状态并生成 archive summary，再删除 active folder。若仍有未完成或未验证事项，在 archive 中如实保留，不用“已归档”替代完成证明。Task 的 `verified` 只触发 context compaction，不触发 workstream cleanup。
