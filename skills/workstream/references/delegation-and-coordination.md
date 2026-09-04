# Delegation and coordination

只有 execution mode 不为 `capture`，或被点名的 Task 带有 one-shot schedule request，且 Task 满足 [task-lifecycle-and-scheduling.md](task-lifecycle-and-scheduling.md) 的 runnable predicate 时才调度。ready Task 可以长期留在 `backlog`；pre-ready 只有同一请求中的明确 per-task override 才能派发，unready 原 Task 不派发。

## Choose the work boundary

只有当 work item 能清楚回答以下问题时才派发：

- objective 是什么；
- scope 与明确排除项是什么；
- 哪个 workspace、模块或产物由它负责；
- 上游输入和下游 consumer 是什么；
- 怎样判断完成；
- 应返回哪些产物与证据；
- 可以执行哪些有后果的操作。

无法形成清晰 contract 的工作仍由 Lead 保持 ownership，先完成探索或决策，不把歧义下放。对尚未足够清晰但值得持续跟踪的事项，可以先建立 `unready` 或 `pre-ready` + `backlog` Task；这不等于获得执行授权。

## Select an execution mode

- **Independent session or task**：需要长期可见、独立 lifecycle、用户可能直接跟进，且 harness 支持时使用。
- **Subagent or equivalent worker**：目标清晰、有界、可验证，且结果可回收到当前 Lead 时使用。
- **Inline**：任务较小、与 Lead 当前判断紧密耦合，或其它执行能力不可用时使用。

复用已有 session 只有在 workspace、branch、ownership 和 canonical context 兼容，且不会覆盖或干扰并发工作时才允许；否则创建新的独立 session，再按能力降级到 subagent/equivalent worker，最后 inline。能力不可用时按上述顺序自动降级。选择执行方式时不把平台能力、模型或私人 worker 配置写入 Task contract。

execution target 由 Lead 记录在 `scheduled` Task 中；目标选择不改变 readiness、权限或共享写入约束。`steady` 受 WIP 限制，`accelerate` 只填充安全可用的 ready Task。

## Build the dependency graph

用真实 typed dependencies 和 blockers 而不是角色标签组织 work：

- contract 或 schema owner 先于 consumer；
- 可以基于明确 draft contract 并行时，写清 version 和 integration gate；
- 多个 work item 修改同一文件、branch、generated artifact、migration 或共享环境时，指定单一 owner 或串行执行；
- 不重叠的探索、实现或验证可以并行；
- 一个结果改变其它 work item 的输入时，Lead 主动更新 Task `dependencies`/`blockers` 或重新派发，不等待用户手工转述。

跨 repo 变更在 Task 中写明 repo、branch/working area、接口边界和合并或发布顺序。一个跨 repo workstream 仍只维护一份 canonical context。

## Dispatch packet

每个 worker 至少获得：

1. Task objective 与用户 outcome；
2. ownership、允许修改的范围及需要保留的已有工作；
3. context、decision、上游产物和 live ref 的精确指针；
4. acceptance 与稳定 `AC-*` IDs；
5. dependencies、active blockers、authority boundary 和停止条件；
6. readiness、lifecycle、显式 override（如有）以及 verification contract；
7. 本次 attempt 的 `AT-*` ID 和 receipt 路径。

Worker 不是独自在代码库中工作。要求它适应其它 work item 的最新结果，不回退或覆盖别人的改动。Worker 只写目标产物并返回结构化 attempt payload；Lead 是 canonical receipt、共享 context、Task 和 review queue 的唯一 writer。

## Verification contract

每个可执行 Task 都要在 packet 中携带结构化 verification contract。它先定义“要证明什么”，再决定“要运行哪些检查”，避免 worker 和 Lead 在结果返回后重新发明验收标准：

```yaml
verification_depth: targeted # receipt-only | targeted | independent
verification:
  claims:
    - id: contract-updated
      acceptance_refs: [AC-001]
      required_evidence:
        - kind: git-diff
          subject: "<artifact or state that must be observed>"
          required_environment: "<environment in which the evidence must be observed>"
          command_or_source: "<command, report, or source locator to use>"
          freshness_or_ref_requirement: "<how current or exact the observed ref/version must be>"
  integration_gates:
    - id: producer-consumer-compatible
      between: "<producer> -> <consumer>"
      expected_version_or_contract: "<version or contract>"
      required_evidence:
        - kind: integration-check
          subject: "<cross-boundary compatibility>"
          required_environment: "<environment>"
          command_or_source: "<check or source locator>"
          freshness_or_ref_requirement: "<current producer and consumer versions>"
```

`verification_depth` 默认为 `targeted`，但 owner、Task 风险或当前 contract 可以选择其它等级。`claims` 必须覆盖 acceptance；Task contract 中的 `required_evidence` 是执行前的证据规格，不是尚不存在的 actual ref/version，至少定义 kind、subject、required_environment、command_or_source 和 freshness_or_ref_requirement。Worker 执行后才在 receipt 中填入 observed evidence 的 actual ref/version、environment、result 和 observed_at。跨 Task 的 producer-consumer 关系写入 `integration_gates`，不能只依赖两个 worker 各自声称局部通过。

## Worker validation

Worker validation 只负责在 Task 自己的 ownership 和允许范围内产生观察：

- 按 contract 对每个 claim 运行必要的命令、检查 artifact 或查询外部来源；
- 在返回给 Lead 的 attempt payload 中逐项填入 claim、`AC-*` acceptance ref、evidence kind、精确 ref/version、environment、command/source、result 和带时区的 `observed_at`；Lead 将 payload 写入新的 `receipts/<task-id>/<attempt-id>.md`；
- 明确记录 limitations、未运行的检查、unverified gaps 和 recovery pointer；
- 即使所有局部检查成功，也只返回 Worker result 并让 Task 进入 `reported`，不自行宣称 Lead verification 或 `verified`；
- 失败或 blocked 也必须返回 receipt，便于 Lead 选择 retry、添加 blocker、cancel 或 supersede。

每个 attempt 使用独立、不可替换的文件。Task 进入 `reported` 后 worker evidence 被封存，Lead 只更新 `lead_verification`；非 pending decision 后整个 receipt finalized。Retry 使用 `AT-002` 等新文件，旧 evidence 仍可用于恢复但不能代表新 attempt。具体字段见 [../assets/context/receipt.md](../assets/context/receipt.md)。

## Lead verification and lifecycle decision

Lead verification 是 evidence-first、incremental 的验收，不是默认重做 worker 工作。Lead 按以下顺序处理 `reported` Task 的 current attempt receipt：

1. **Evidence binding**：确认每条 evidence 指向当前有效的 commit、artifact、schema/version、environment 或外部状态；区分 static、local、CI、runtime、release 和 production evidence；
2. **Acceptance coverage**：把 receipt 中的 claim-evidence mapping 对回 Task 的 `AC-*` acceptance 和 required evidence，标出缺失、只覆盖局部或仍为 unknown 的项；
3. **Integration coverage**：检查每个 integration gate 的 producer、consumer、版本和跨边界结果；不能用两个局部 success claim 代替集成证据；
4. **Apply the declared depth**：证据已充分时，只做该深度要求的检查；证据不足或风险触发升级时，记录理由并增加验证范围；
5. **Record one decision**：在 attempt receipt 的 `lead_verification` 写入 `outcome`、`effective_depth`、`decided_at`、必要的 `verified_at`、`escalation_trigger` 和 `additional_checks`，并同步更新 Task 的唯一 `lifecycle` 与 active blockers/current attempt pointer。

Lead decision 只有一个 current Task lifecycle 真相：

| Outcome | Task lifecycle | Decision evidence |
| --- | --- | --- |
| `accepted` | `verified` | `verified_at` 非空；记录 acceptance/integration 覆盖。 |
| `retry` | `backlog` | `decided_at` 非空；说明返工范围，下一次创建新 `AT-*`。 |
| `blocked` | `backlog` | `decided_at` 非空；Task 增加 typed `blockers[]`，说明解除条件。 |
| `cancelled` | `cancelled` | `decided_at` 非空；记录 owner reason。 |
| `superseded` | `superseded` | `decided_at` 非空；记录替代 Task/方案。 |

`lead_verification` 不维护第二个 `status` 字段。`decided_at` 适用于所有非 pending decision；`verified_at` 仅 accepted 时填写。Task lifecycle 的更新与 receipt decision 应作为同一个 Lead context update 完成，避免 receipt 已 accepted 但 Task 仍显示旧状态。

当 evidence binding、acceptance coverage 和 integration coverage 都充分时，Lead 不应从头重复 worker 的调查、重新跑全部测试或重新生成已有 artifact。Lead 仍需检查 receipt 是否真的包含 evidence，而不是把 worker 的声明当作 evidence。

| Verification depth | Lead 行为 | 适用情况 |
| --- | --- | --- |
| `receipt-only` | 审计每条 evidence 的可追溯性、acceptance 映射和 integration gate；不以声明替代 evidence。 | 低风险、证据完整且可直接回读的工作。 |
| `targeted` | 先完成上述审计，再补最关键的一个或少量 acceptance/integration 检查。 | 默认等级；普通实现、文档或契约变更。 |
| `independent` | 独立复现核心结论和关键边界，并记录独立观察。 | 权限、安全、隐私、迁移、发布、资损、高风险架构或不可逆影响。 |

Lead 可以因风险升级 verification depth，但必须在 `effective_depth`、`escalation_trigger` 和 `additional_checks` 中记录升级后的等级、理由和增加的检查；不得静默降级。如果声明的等级无法执行，应保持 `reported` 或将 Task 决策为 `blocked` 并报告缺口，而不是假装完成。

只有出现以下信号时才扩大到超出声明深度的调查或验证：

- evidence 缺失、不可追溯或与 claim 不匹配；
- ref、version、environment 或 live state 已过期、漂移或无法证明仍有效；
- evidence 互相矛盾，或 acceptance/integration 有缺口；
- 测试存在 flaky、不可重现或只覆盖局部的信号；
- worker 明确标记 limitation 或 unverified gap；
- 工作涉及高风险、不可逆或重大外部影响；
- owner 明确要求独立复核。

扩大验证时，优先补能决定 acceptance 的关键检查，并记录触发器、增加的范围和结果。除非命中上述信号，不要重复 worker 已经有充分 evidence 支持的工作。

## Owner attention and closeout

Review records 是 owner-facing attention queue，不是默认 approval gate。每个 review 使用 `RV-*` ID、`intent: inspect | advise | decide` 和 `status: queued | presented | resolved | waived | superseded`：

- `inspect` 内容在 closeout 中完整展示后可当轮 `resolved`；只展示索引则保持 `presented`；
- `advise` 允许 Lead 依据已记录的可逆 default assumption 继续，反馈失去意义时可 `resolved`、`waived` 或 `superseded`；
- `decide` 等待 owner 决定，但仅 Task `blockers[].ref: review:RV-*` 明确引用的窄范围被阻塞；`task.blockers[].ref` 是唯一 canonical blocking source。只有 `queued`/`presented` 的 active `decide` review 可被引用，引用 `inspect`、`advise` 或 terminal review 是 schema error；
- Review 的 `related_tasks`/`context_refs` 只是关联信息，不是 blocker；Review 不维护 canonical `blocks` 字段；
- Review 无论 status 如何都不计入 WIP；Lead 在 closeout 中从 Task blockers 反向派生每个 Review 的 blocking scope。

每轮 Lead work cycle 结束时，必须派生并展示 closeout：mode/WIP、backlog counts、hot tasks、this-turn changes、Task blockers 和 owner attention。新 queued 内容少时直接展示；内容多时给出索引、reading costs（阅读成本）、推荐顺序并让 owner 点选具体 review 介绍。blocking decide 项突出；presented 的 non-blocking 项压缩为 count/title，不让 optional review 阻塞无关工作。Closeout 是响应视图，不持久化 session status，也不额外创建 Task。

## Supervise and integrate

Lead 应：

- 使用 harness 提供的等待或状态能力跟进已派发工作，避免无意义轮询；
- 优先从已有 context、Task contract 和 attempt receipt 回答 worker 问题；只有答案会改变用户目标、权限或重大取舍时才升级；
- 对失败区分实现问题、依赖未就绪、权限不足、live state 漂移与 acceptance 不清；
- 先按本节 evidence-first 流程检查实际 diff、artifact、测试或外部状态，再接受 receipt；
- 由 Lead 统一更新 Task lifecycle、active blockers、current attempt、共享 context 和 review queue；
- 在 consumer 与 producer 之间执行 integration verification，而不是只验证各自局部通过；
- 完成一个 work item 后重新评估 dependency graph、owner attention 和剩余 acceptance，不因局部完成而自动关闭 workstream。
