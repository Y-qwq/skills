---
name: workstream
description: >
  Lead a long-running body of work from natural-language requests by maintaining durable context,
  coordinating dependent work across repositories or specialties, dispatching available workers,
  verifying integrated outcomes, and reporting concise progress. Use when one accountable lead should
  manage a multi-step or multi-party effort over time. Not for a single self-contained task that does
  not need persistent coordination.
---

# Workstream

为需要持续协调的工作建立一个负责到底的 lead。用户只需要描述目标或变更；lead 负责理解已有 context、识别影响面、组织执行、校验集成结果，并维护可恢复的长期状态。

不要因为任务包含多个步骤就自动创建 workstream。若一个任务能够在当前上下文内直接完成，不需要跨任务协调或长期恢复，直接执行即可。

## Start or resume

1. 解析用户配置的 workstreams root；默认使用 `~/.agents/workstreams`。
2. 按名称、目标、workspace 与已有 context 判断是恢复现有 workstream，还是创建新的唯一 slug。不要为同一项工作创建多个目录。
3. 首次进入、恢复或改变生命周期时，读取 [references/context-lifecycle.md](references/context-lifecycle.md)。
4. 加载最小充分 context，并从代码、仓库、任务系统或其它权威来源刷新即将影响决策的当前事实。Context 是协调缓存，不是当前事实的替代品。
5. 将用户请求转化为 outcome、scope、acceptance、依赖与待验证假设。只有缺失信息会实质改变目标、权限或外部影响时才询问用户。

## Lead loop

对每次请求执行同一个闭环：

1. **Orient**：读取 workstream context，刷新相关 live state，确认用户的新请求如何改变当前目标。
2. **Plan**：识别责任边界、依赖顺序、共享写入面与集成检查点。
3. **Dispatch or execute**：简单工作直接完成；需要分工时派发边界清晰、可独立验收的 work item。
4. **Supervise**：跟进阻塞、回答 context 内可解决的问题，并在依赖或 scope 变化时主动调整其它 work item。
5. **Integrate**：检查实际产物与当前状态，不把 worker 的完成声明当作充分证据。
6. **Record**：由 lead 更新共享 context、decision、task 状态和 delivery receipt。
7. **Report**：向用户总结 outcome、交付物、验证、关键判断和剩余事项，而不是复述操作流水账。

需要派发、并行或协调共享代码时，读取 [references/delegation-and-coordination.md](references/delegation-and-coordination.md)。

## Execution fallback

根据当前 harness 提供的能力，依次选择最合适的隔离方式：

1. 独立 session 或 task，适合需要长期可见、可单独跟进的 work item；
2. subagent 或等价 worker，适合当前 lead 内部的有界执行；
3. lead inline 执行。

某一种能力不可用时自动降级到下一种，不要仅因缺少独立 session 而停下。选择执行方式时仍需遵守当前 harness、用户 scope 与仓库规则。

## Authority and mutations

可执行范围由用户授权、当前 harness 权限和目标系统规则共同决定。Harness 权限是能力边界，不自动证明用户意图；本 skill 也不发明额外的 blanket ban。

在执行 push、merge、发布、历史改写、共享状态覆盖或其它有后果的操作前，读取 [references/delivery-and-recovery.md](references/delivery-and-recovery.md)。当权限、ownership、并发影响、下游影响或恢复能力存在实质不确定性时再升级给用户。

## Context ownership

每个 workstream 只有 lead 写入共享 context。Worker 读取 task packet 和必要 context，返回结构化 receipt；不要让多个 worker 直接并发修改 `context.md`、`state.md` 或 `decisions.md`。

一个跨 repo workstream 仍只有一个 canonical context folder。不要在每个 repo 复制一份状态。不要在 context 中保存 secret、token、进程锁、临时 session handle 或其它机器级瞬时数据。

## Completion

Work item 完成不等于 workstream 完成。持续维护 active context，直到用户明确表示整个 workstream 已完成、取消或需要清理。

收到明确完成指令后，先验证交付状态并生成 archive summary，再删除 active folder。若仍有未完成或未验证事项，在 archive 中如实保留，不用“已归档”替代完成证明。
