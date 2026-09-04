# Task lifecycle and scheduling

## Separate dimensions

每个 Task 至少维护三个互相独立的维度：

```yaml
readiness: unready | pre-ready | ready
lifecycle: backlog | scheduled | in_progress | reported | verified | cancelled | superseded
blocked_by: []
one_shot_schedule_request: null
execution_override: null
verification_depth: targeted
verification:
  claims: []
  integration_gates: []
```

- `readiness` 表示任务定义是否足够成熟，不表示是否正在执行。
- `lifecycle` 表示任务在交付流程中的位置，不表示产品优先级或结果质量。
- `blocked_by` 记录外部任务、决策、输入或环境阻塞；为空才表示没有已知 blocker。不要把 `blocked` 另造为 lifecycle 值。

因此，`ready + backlog` 表示已经可以执行但尚未排期，`ready + blocked_by` 表示定义清楚但在等待依赖，`pre-ready + in_progress` 表示用户明确允许在受控假设下推进。

## Readiness

### `ready`

目标、scope、约束和 acceptance 已经足够明确；剩余选择属于可委托的判断范围，不会改变交付物的基本形态、权限或外部影响。该 Task 可以被调度。

### `pre-ready`

已有方向，但缺失信息可能实质改变结果。默认不执行；只有用户或 workstream owner 对该 Task 明确授权，并且执行范围有界、可逆、假设和停止条件已记录时，才可以调度。优先把它限制为调研、原型、契约草案或其它不会锁定最终方案的工作。

### `unready`

只知道未来需要做，目标、scope 或 acceptance 尚未形成有界 outcome。原 Task 不直接执行。Lead 可以继续与 owner 澄清，或创建一个独立的 `ready` 调研/澄清 Task；子 Task 的结果不能自动使原 Task 变为 ready。

“不保证 100% 符合预期”不是单独的 readiness 标准。关键问题是缺失信息是否会改变交付物，以及基于假设推进的返工、副作用和恢复成本是否可接受。

## Lifecycle

正常路径为：

```text
backlog → scheduled → in_progress → reported → verified
```

其它合法终态为 `cancelled` 和 `superseded`。Lead 可以在未开始执行时把 `scheduled` 退回 `backlog`，也可以在依赖变化时重新排期；不得跳过 receipt 与集成验证直接把 worker 的完成声明记为 `verified`。

- `backlog`：已捕获并值得持续跟踪，尚未排期执行。
- `scheduled`：已选择执行目标、顺序或时间窗口，但 worker 尚未开始。
- `in_progress`：执行目标已接手并正在工作。
- `reported`：执行目标已返回包含 claim-evidence mapping 的 receipt，lead 尚未完成验收或集成验证。
- `verified`：lead 已按 verification contract 检查实际产物、依赖和集成 acceptance，并吸收稳定结论。
- `cancelled`：owner 主动取消，不再执行。
- `superseded`：由另一个 Task 或新方案替代；记录替代者指针。

Task 的完成事件通常只会把 lifecycle 推进到 `reported`。`verified` 是 lead 的判断，必须有与 acceptance 相称的证据。Workstream 仍可能有其它 backlog 或未验证 Task，不能因单个 Task verified 而关闭。

Receipt 使用独立的 `result` 记录执行观察，例如 `succeeded`、`partial`、`failed` 或 `blocked`；它不替代 Task 的 lifecycle，也不自动授予 `verified`。Receipt 中的 worker validation 与 Lead verification 是两个不同判断：前者说明 worker 在自己的边界内观察到了什么，后者决定 evidence 是否足以覆盖 acceptance 与 integration。

Task 的 `verification_depth` 是执行前声明的 requested depth。Receipt 还要记录 `requested_verification_depth` 和 Lead 实际采用的 `effective_verification_depth`；Lead 因风险升级时保留原 requested 值，在 `lead_verification` 中记录状态、`escalation_trigger` 和 `additional_checks`。`history.md` 只记录 effective depth，避免把尚未完成 Lead 判断的声明当成最终事实。

## Capture and materialize

默认每次用户对话先更新 backlog，不立即执行。只有以下工作才 materialize 成独立 Task：

- 有独立 owner 或 execution target；
- 有依赖、阻塞、顺序或并发控制需求；
- 能独立验收，或需要独立恢复；
- 会修改独立 workspace、branch 或 artifact。

普通对话、context 写回、单纯的 commit/push 或一次性 lead 判断写入既有 Task、decision 或 receipt，不重复建立 Task。长期值得跟踪但尚未想清楚的工作可以建立 `unready + backlog` Task；短暂想法不必污染任务目录。

## State projection

`tasks/*.md` 是 open backlog 的 canonical board；它们可以持续积累 `unready`、`pre-ready` 和 `ready` Task。`state.md` 不是第二份 board，只保留 readiness/lifecycle 的聚合 counts、`scheduled`/`in_progress`/`reported` hot tasks、下一批可调度候选和关键 blocker。不要把全部 unready/pre-ready backlog 逐行复制到 `state.md`；恢复时按请求从 `tasks/` 加载需要的 Task。

## WIP accounting

默认 `wip_limit` 是 `4`。WIP 是一个调度容量约束，按当前 lifecycle 推导：

```text
wip_count = count(task.lifecycle in {scheduled, in_progress, reported})
```

`backlog`、`verified`、`cancelled` 和 `superseded` 不计入 WIP。`reported` 仍占容量，因为 worker 已交付但 Lead 尚未完成 verification；只有推进到 `verified`、`cancelled`、`superseded` 或退回 `backlog` 后才释放容量。

`capture` 不会自动填充 WIP。WIP 4 只约束 owner 明确排期、`steady` 或 `accelerate` 下的调度；调度前重新计算当前 WIP，达到上限时保留 Task 在 backlog，并说明占用容量的 hot tasks。用户或项目可以声明其它有效 WIP，但 Lead 必须把 effective limit 和作用范围记录在 `state.md`，不能静默覆盖。

## Execution modes

Workstream 维护一个当前 execution mode；默认值是 `capture`：

| Mode | 调度行为 |
| --- | --- |
| `capture` | 只捕获、拆分、补齐和排序 backlog；不把 Task 变为 `scheduled`，不派发。 |
| `steady` | 以小 WIP 限制推进，通常先运行一个最高优先级、无阻塞的 `ready` Task。 |
| `accelerate` | 在安全容量内并行填充可运行的 `ready` Task，并保持依赖、共享写入和单一 owner 约束。 |

`steady` 和 `accelerate` 都不会自动放宽 readiness、用户授权、仓库权限、branch 保护或共享写入安全。`pre-ready` 默认 `explicit_only`；只有记录了针对该 Task 的明确 override，才可在受控范围内执行。`unready` 原 Task 永远不可调度。

用户可以改变 execution mode、WIP 或单个 Task 的 override。例如暂停执行继续积累 backlog、只稳步执行 ready，或在确认风险后允许某个 pre-ready 调研。Lead 应把该决定和作用范围记录在 state，而不是静默改变全局策略。

## One-shot schedule requests

默认 `capture` 只禁止自动调度，不禁止 owner 对某个 Task 发出明确的一次性排期请求。只有语义明确指向具体 Task 的“执行/排期这个 Task”才算 one-shot request；普通的新想法、继续讨论或“以后做”仍只更新 backlog。

记录在 Task 的 `one_shot_schedule_request` 中，并在调度后消费或标记为已处理。它只绕过 `capture` 的自动调度门槛，不绕过 WIP、依赖、blocker、权限、branch 或共享写入安全。owner 的一次性请求也不能把一个 Task 变成可执行的 readiness。

对于 `ready` Task，明确的 one-shot request 足以在 capture mode 下触发该 Task 的一次排期；其余 backlog 不受影响。对于 `pre-ready` Task，同一个请求还必须明确接受不确定性，并在 `execution_override` 中记录有界、可逆的 scope、假设和 stopping condition。只说“执行一下”而没有接受不确定性或控制范围时，仍不得调度 pre-ready Task。`unready` 原 Task 即使收到 one-shot request 也不执行，应先创建澄清/调研子 Task。

## Runnable predicate

不要持久化冗余的 `runnable` 字段；每次调度时从当前状态推导：

```text
runnable(task) =
  task.lifecycle == backlog
  AND task.blocked_by is empty
  AND all dependencies are satisfied
  AND (execution_mode != capture OR task.one_shot_schedule_request is explicit)
  AND (
    task.readiness == ready
    OR (
      task.readiness == pre-ready
      AND task.one_shot_schedule_request is explicit
      AND task.execution_override accepts uncertainty and records bounded scope
    )
  )
```

`ready` 但有 `blocked_by` 的 Task 不可调度。多个 runnable Task 仍需检查是否修改同一文件、branch、generated artifact、migration 或共享环境；冲突时指定单一 owner 或串行执行。

在 `steady` 或 `accelerate` 下，`ready` Task 不需要 one-shot request；pre-ready 仍需要明确的 per-task override。One-shot request 只影响被点名的 Task，不改变 execution mode，也不让其它 Task 随之运行。

## Legacy status migration

恢复旧 context 时，先把旧的单一 `status` 映射到新的 lifecycle，再重新评估 readiness、dependencies 和 `blocked_by`：

| Legacy value | Initial lifecycle mapping | Required follow-up |
| --- | --- | --- |
| `planned` | `backlog` | 重新评估 readiness；不要因为旧计划存在就自动调度。 |
| `waiting` | `backlog` | 把等待的输入/任务写入 `blocked_by`，再根据 live state 清理已解除的 blocker。 |
| `completed` 或 receipt 的 completed claim | `reported` | 重新检查当前产物、live authority、acceptance 和集成；只有 lead 当前验证后才可 `verified`，然后才可 compaction。 |
| `cancelled` | `cancelled` | 保留取消原因和时间，不重新排期。 |
| `superseded` | `superseded` | 记录替代 Task 或方案指针，不重新排期。 |

旧 receipt、worker 声明或历史 summary 都是待验证证据，不是 `verified` 授权。迁移本身应记录旧值、映射、重新评估结果和仍缺失的证据；不要把 `completed` 直接复制成 `verified`。

## Roles and handoff

- `workstream owner`：设定 outcome、优先级、execution mode、WIP、特殊 override 和 workstream closure。
- `lead`：维护唯一 context 和 backlog，拆分 Task，判断 readiness，选择执行目标，监督、验收、集成和压缩历史。
- `execution target`：可以是新 session、已有 session、subagent 或等价 worker；只修改 Task contract 允许的范围，返回 receipt，不直接写共享 context。

派发 packet 必须包含 Task 的 objective、scope、workspace、依赖、acceptance、verification contract、授权边界、停止条件和 receipt 指针。Verification contract 至少包含 `verification_depth`（默认为 `targeted`）、逐项 claim 的 required evidence 和 producer-consumer integration gates。Lead 在 receipt 返回后重新读取 live authority，并按证据协议决定 `reported` 是否可以推进到 `verified`。

## Verified compaction

当 Task 进入 `verified`：

1. 把稳定结论提升到 `context.md`、`decisions.md` 或项目权威 artifact；
2. 在 `history.md` 追加紧凑记录，包含 Task 或 milestone、outcome、delivery、verification depth、`closed_at` 和唯一 evidence/recovery pointer。相邻、同 owner、没有独立恢复价值的微任务可以合并为一个 milestone，但保留包含的 Task IDs 和所有仍有价值的指针；
3. 从 `state.md` 的 active/hot tasks 移除；
4. 删除或移出详细 Task/receipt 热区。若 receipt 含有不能由 history 或权威 artifact 重建的证据或恢复信息，将它移到明确的历史路径并由 history 指向，而不是保留两份 current truth；
5. 重新评估依赖图和剩余 backlog，不因 compaction 关闭 workstream。

只有用户明确关闭整个 workstream 时，才按 [context-lifecycle.md](context-lifecycle.md) 生成最终 archive 并删除 active context。
