# Task lifecycle and scheduling

## Schema v2 dimensions

每个 Task 至少维护这些互相独立的维度：

```yaml
schema_version: 2
id: T-001
readiness: ready # unready | pre-ready | ready
lifecycle: backlog # backlog | scheduled | in_progress | reported | verified | cancelled | superseded
dependencies: []
blockers: []
one_shot_schedule_request: null
execution_override: null
verification_depth: targeted # receipt-only | targeted | independent
current_attempt_id: null
verification:
  claims: []
  integration_gates: []
```

- `readiness` 表示任务定义成熟度，不表示优先级或是否正在执行。
- `lifecycle` 是 Task 的唯一当前执行真相，不与 readiness、receipt result 或 review status 混用。
- `dependencies` 是稳定的前置关系图；`blockers` 是当前阻塞条件。两者都必须是 typed records，而不是只写一个名字的字符串。
- 不持久化 `runnable`。每次排期都根据当前 lifecycle、dependencies、blockers、mode、readiness、授权和共享写入约束推导。
- Task acceptance 与 claim mapping 使用稳定 `AC-001`、`AC-002` 等 ID。已有 acceptance ID 不重编号；新增 acceptance 追加新 ID。

## Readiness

### `ready`

目标、scope、约束和 acceptance 已足够明确；剩余选择属于可委托的判断范围，不会改变交付物的基本形态、权限或外部影响。该 Task 可以被调度。

### `pre-ready`

已有方向，但缺失信息可能实质改变结果。默认不执行；只有 owner 对该 Task 明确授权，并且执行范围有界、可逆、假设和停止条件已记录时，才可以调度。优先把它限制为调研、原型、契约草案或其它不会锁定最终方案的工作。

### `unready`

只知道未来需要做，目标、scope 或 acceptance 尚未形成有界 outcome。原 Task 不直接执行。Lead 可以继续与 owner 澄清，或创建独立的 `ready` 调研/澄清 Task；子 Task 的结果不能自动使原 Task 变为 ready。

“不保证 100% 符合预期”不是单独的 readiness 标准。关键问题是缺失信息是否会改变交付物，以及基于假设推进的返工、副作用和恢复成本是否可接受。

## Lifecycle and attempts

正常路径为：

```text
backlog → scheduled → in_progress → reported → verified
                                      ├→ backlog + retry
                                      ├→ backlog + typed blocker
                                      ├→ cancelled
                                      └→ superseded
```

- `backlog`：已捕获并值得持续跟踪，尚未排期执行。
- `scheduled`：已选择执行目标、顺序或时间窗口，但 worker 尚未开始。
- `in_progress`：执行目标已接手并正在工作。
- `reported`：某个 attempt 已返回 receipt，Lead 尚未完成 acceptance/integration decision。
- `verified`：Lead 已按 verification contract 检查实际产物、依赖和集成 acceptance，并吸收稳定结论。
- `cancelled`：owner 主动取消，不再执行。
- `superseded`：由另一个 Task 或新方案替代；记录替代者指针。

每次 worker 执行都产生一个独立 attempt payload，由 Lead 创建 `receipts/<task-id>/AT-001.md`、`AT-002.md` 等 canonical record。Receipt 的 `result` 描述本次观察（通常为 `succeeded`、`partial`、`failed` 或 `blocked`），不替代 Task lifecycle，也不自动授予 `verified`。Lead 记录 `reported` 后封存 worker evidence，只更新该 receipt 的 `lead_verification`；非 pending decision 写入后整个 record finalized。

| Lead decision outcome | Task lifecycle | Required follow-up |
| --- | --- | --- |
| `accepted` | `verified` | `verified_at` 非空；提升稳定结论并按需 compaction。 |
| `retry` | `backlog` | 保留当前 attempt；修正 contract/环境后下一次执行创建新的 `AT-*`。 |
| `blocked` | `backlog` | 在 Task `blockers[]` 增加 active typed blocker；不要新增 `blocked` lifecycle。 |
| `cancelled` | `cancelled` | 记录 owner decision、原因和时间。 |
| `superseded` | `superseded` | 记录替代 Task、方案或 decision pointer。 |

因此，失败或 blocked 的 worker 不会让 Task 卡在一个不可解释的状态：Lead 要么退回 backlog 重试，要么退回 backlog 并留下 blocker，要么明确结束/替代。Retry 永远不覆盖旧 receipt，也不把旧 attempt 的结论伪装成新 attempt 的证据。

## Lead verification record

Lead decision 记录在 attempt receipt 的 `lead_verification` 中，只保存 decision/evidence，不复制 Task lifecycle：

```yaml
lead_verification:
  outcome: pending # pending | accepted | retry | blocked | cancelled | superseded
  effective_depth: null # receipt-only | targeted | independent
  decided_at: null
  verified_at: null
  escalation_trigger: null
  additional_checks: []
```

`decided_at` 用于 accepted、retry、blocked、cancelled、superseded 等所有非 pending decision；`verified_at` 只在 `outcome: accepted` 且 Task lifecycle 为 `verified` 时非空。失败/重试/阻塞不使用 `verified_at` 记录决定时间。`effective_depth` 只有 Lead 实际做出 decision-relevant check 后才填入；未决 receipt 保持 `null`。

Worker validation 与 Lead verification 是两个判断：前者说明 worker 在自己的边界内观察到了什么，后者决定 evidence 是否足以覆盖 acceptance 与 integration，并决定 Task 的下一 lifecycle。Lead 不在 receipt 中写一个与 Task lifecycle 并列的 `status` 真相。

## Dependencies and blockers

使用 typed records，避免 `depends_on`、`blocked_by`、正文列表和 `runnable` 形成多份 current truth：

```yaml
dependencies:
  - ref: task:API-01
    required_lifecycle: verified
  - ref: artifact:message-schema
    required_condition: version-20-published
blockers:
  - ref: review:RV-003
    kind: owner-decision
    reason: owner must choose the migration policy
```

- `dependencies` 描述稳定 prerequisite graph；其满足情况在排期时从被引用对象的当前状态/外部 authority 推导。
- `blockers` 只列当前有效、schema-valid、直接阻止该 Task 的条件；条件解除后移除或标记为历史并从 active list 清掉。不要在另一个实体维护同一条阻塞关系。
- Review 的 `related_tasks` 不阻塞。Review 没有 canonical `blocks` 字段；只有 Task 的 `blockers[].ref: review:RV-*` 才形成阻塞，Lead 在 closeout 中反向投影其 blocking scope。
- `review:RV-*` blocker 只能引用 `queued` 或 `presented` 的 `intent: decide` review。引用 `inspect`、`advise` 或 terminal review 是 schema error；Lead 应报告并移除或修正该无效 entry，不把它当成 active blocker。需要阻塞时先把 review 转为 active `decide` 并记录原因。
- 依赖和 blocker 可以同时存在；Task 只有两者都满足时才可 runnable。

## Capture and materialize

默认每次用户对话先更新 backlog，不立即执行。只有以下工作才 materialize 成独立 Task：

- 有独立 owner 或 execution target；
- 有依赖、阻塞、顺序或并发控制需求；
- 能独立验收，或需要独立恢复；
- 会修改独立 workspace、branch 或 artifact。

普通对话、context 写回、单纯的 commit/push 或一次性 Lead 判断写入既有 Task、decision 或 receipt，不重复建立 Task。长期值得跟踪但尚未想清楚的工作可以建立 `unready + backlog` Task；短暂想法不必污染任务目录。

## State projection and WIP

`tasks/*.md` 是 open backlog 的 canonical board；它们可以持续积累 `unready`、`pre-ready` 和 `ready` Task。`state.md` 只保留 readiness/lifecycle 聚合 counts、`scheduled`/`in_progress`/`reported` hot tasks、下一批可调度候选、关键 blockers 和 owner attention projection。不要把全部 backlog 或 review 内容复制成第二份 board。

默认 `wip_limit` 是 `4`。WIP 按当前 lifecycle 推导：

```text
wip_count = count(task.lifecycle in {scheduled, in_progress, reported})
```

`backlog`、`verified`、`cancelled`、`superseded` 不计入 WIP。`reported` 仍占容量，因为 worker 已交付但 Lead 尚未完成 decision；推进到 `verified`、`cancelled`、`superseded` 或退回 `backlog` 后才释放容量。Review 无论 intent/status 都不计 WIP。

`capture` 不会自动填充 WIP。WIP 4 只约束 owner 明确排期、`steady` 或 `accelerate` 下的调度；调度前重新计算当前 WIP，达到上限时保留 Task 在 backlog，并说明占用容量的 hot tasks。用户或项目可以声明其它有效 WIP，但 Lead 必须把 effective limit 和作用范围记录在 `state.md`。

## Execution modes

Workstream 维护一个当前 execution mode，默认值是 `capture`：

| Mode | 调度行为 |
| --- | --- |
| `capture` | 只捕获、拆分、补齐和排序 backlog；不把 Task 变为 `scheduled`，不派发。 |
| `steady` | 以 WIP 限制推进，通常先运行一个最高优先级、无 blocker 的 `ready` Task。 |
| `accelerate` | 在安全容量内并行填充可运行的 `ready` Task，并保持依赖、共享写入和单一 owner 约束。 |

`steady` 和 `accelerate` 都不会自动放宽 readiness、用户授权、仓库权限、branch 保护或共享写入安全。`pre-ready` 默认 `explicit_only`；只有记录了针对该 Task 的明确 override，才可在受控范围内执行。`unready` 原 Task 永远不可调度。

## One-shot schedule requests

默认 `capture` 只禁止自动调度，不禁止 owner 对某个 Task 发出明确的一次性排期请求。只有语义明确指向具体 Task 的“执行/排期这个 Task”才算 one-shot request；普通新想法、继续讨论或“以后做”仍只更新 backlog。

对于 `ready` Task，明确的 one-shot request 足以在 capture mode 下触发该 Task 的一次排期；对于 `pre-ready` Task，同一请求还必须明确接受不确定性，并在 `execution_override` 中记录有界、可逆的 scope、假设和 stopping condition。`unready` 原 Task 即使收到 request 也不执行，应先创建澄清/调研子 Task。

One-shot request 只绕过 capture 的自动调度门槛，不绕过 WIP、dependencies、blockers、权限、branch 或共享写入安全；排期后消费或标记为已处理，不改变全局 mode。

## Runnable predicate

不要持久化冗余的 `runnable` 字段；每次调度时从当前状态推导：

```text
runnable(task) =
  task.lifecycle == backlog
  AND valid_active_blockers(task) is empty
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

`ready` 但有 valid active blocker 的 Task 不可调度。发现 schema-invalid blocker 时先报告并修正 canonical Task record；不要让无效 review 引用阻塞执行，也不要静默忽略脏数据。多个 runnable Task 仍需检查是否修改同一文件、branch、generated artifact、migration 或共享环境；冲突时指定单一 owner 或串行执行。

## Legacy status migration

恢复旧 context 时，先把旧的单一 `status` 映射到新的 lifecycle，再重新评估 readiness、dependencies 和 blockers：

| Legacy value | Initial lifecycle mapping | Required follow-up |
| --- | --- | --- |
| `planned` | `backlog` | 重新评估 readiness；不要因为旧计划存在就自动调度。 |
| `waiting` | `backlog` | 转为 typed `blockers`，写入 `ref`、`kind`、`reason`，再根据 live state 清理已解除的 blocker。 |
| `completed` 或 receipt completed claim | `reported` | 重新检查当前产物、live authority、acceptance 和 integration；只有 Lead 当前 decision 后才可 `verified`。 |
| `cancelled` | `cancelled` | 保留取消原因和时间，不重新排期。 |
| `superseded` | `superseded` | 记录替代 Task 或方案指针，不重新排期。 |

迁移旧 receipt 时，`receipts/<task-id>.md` 变为 `receipts/<task-id>/AT-001.md`；旧 acceptance claims 的 `A1` 等非稳定 ID 迁为 Task-local `AC-001` 等并同步 Task contract。Workstream-level acceptance 使用 `WAC-*`；Task scope 外需要用 `task:<task-id>#AC-001` 复合引用。旧 receipt、worker 声明或 history summary 都是待验证 evidence，不是 `verified` 授权。迁移必须遵循 [context-lifecycle.md](context-lifecycle.md) 的 checkpoint、碰撞检测和 final marker 顺序。

## Roles and handoff

- `workstream owner`：设定 outcome、优先级、execution mode、WIP、特殊 override 和 workstream closure。
- `lead`：维护唯一 context 和 backlog，拆分 Task，判断 readiness，选择执行目标，监督、验收、集成、维护 review queue 和压缩历史。
- `execution target`：可以是新 session、已有 session、subagent 或等价 worker；只修改 Task contract 允许的范围，返回一个新的 attempt payload，不直接写 canonical receipt 或其它共享 context。

派发 packet 必须包含 Task objective、scope、workspace、dependencies、active blockers、acceptance（含 `AC-*`）、verification contract、授权边界、停止条件、current attempt ID 和 receipt 路径。Lead 在 receipt 返回后重新读取 live authority，写入 Lead decision evidence，并按证据协议决定 `reported` 是否转为 `verified`、`backlog`、`cancelled` 或 `superseded`。

## Lead closeout view

每轮 Lead work cycle 完成后，从当前 projection、Task 和 review records 派生一次 closeout，不创建“session status”或额外 Task：

1. `mode / WIP`：当前 mode、limit、counted lifecycle 与占用容量的 Task；
2. `backlog counts`：按 readiness 的 backlog 总数与 active blocker 数；
3. `hot tasks`：scheduled、in_progress、reported 的当前 lifecycle、attempt 与下一步；
4. `this-turn changes`：本轮新增/更新/排期、Lead decisions、attempts 和依赖变化；
5. `blockers`：按 Task 的 canonical `blockers[]` 列出，明确是 review、dependency、输入还是环境；
6. `owner attention`：按 review intent/status 展示 queued/presented 内容与反向派生的 blocking Tasks。

新 `queued` review 内容少时直接展示 artifact、问题、推荐和预计阅读成本；内容多或篇幅大时展示索引、每项阅读成本与推荐顺序，让 owner 点选“介绍 RV-003”等具体项。blocking `decide` review 始终突出；已完整展示的 non-blocking `inspect` 可当轮 resolved，只展示索引的项保持 `presented`；presented 的 non-blocking review 以 compact count/title 呈现，不阻塞 Lead 继续推进无关工作。

## Verified compaction

Task verified 后按 [context-lifecycle.md](context-lifecycle.md) 的 compaction 规则提升结论并保留 attempt pointer；不要把 `verified` 写回 receipt 的另一套 lifecycle。未终结 review 不因相关 Task compaction 自动删除。
