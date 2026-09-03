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

无法形成清晰 contract 的工作仍由 lead 保持 ownership，先完成探索或决策，不把歧义下放。

对尚未足够清晰但值得持续跟踪的事项，可以先建立 `unready` 或 `pre-ready` + `backlog` Task；这不等于获得执行授权。

## Select an execution mode

- **Independent session or task**：需要长期可见、独立 lifecycle、用户可能直接跟进，且 harness 支持时使用。
- **Subagent or equivalent worker**：目标清晰、有界、可验证，且结果可回收到当前 lead 时使用。
- **Inline**：任务较小、与 lead 当前判断紧密耦合，或其它执行能力不可用时使用。

复用已有 session 只有在 workspace、branch、ownership 和 canonical context 兼容，且不会覆盖或干扰并发工作时才允许；否则创建新的独立 session，再按能力降级到 subagent/equivalent worker，最后 inline。能力不可用时按上述顺序自动降级。不要把平台能力名称、模型名称或私人 worker 配置写入 task contract。

execution target 由 lead 记录在 `scheduled` Task 中；目标选择不改变 readiness、权限或共享写入约束。`steady` 受 WIP 限制，`accelerate` 只填充安全可用的 ready Task。

## Build the dependency graph

用真实依赖而不是角色标签组织 work：

- contract 或 schema owner 先于 consumer；
- 可以基于明确 draft contract 并行时，写清 version 和 integration gate；
- 多个 work item 修改同一文件、branch、generated artifact、migration 或共享环境时，指定单一 owner 或串行执行；
- 不重叠的探索、实现或验证可以并行；
- 一个结果改变其它 work item 的输入时，lead 主动更新或重新派发，不等待用户手工转述。

跨 repo 变更在 task 中写明 repo、branch/working area、接口边界和合并或发布顺序。一个跨 repo workstream 仍只维护一份 canonical context。

## Dispatch packet

每个 worker 至少获得：

1. task objective 与用户 outcome；
2. ownership、允许修改的范围及需要保留的已有工作；
3. context、decision、上游产物和 live ref 的精确指针；
4. acceptance 与验证要求；
5. authority boundary 和停止条件；
6. Task 的 readiness、lifecycle、blocked_by、显式 override（如有）和 receipt 格式。

Worker 不是独自在代码库中工作。要求其适应其它 work item 的最新结果，不回退或覆盖别人的改动。

## Supervise and integrate

Lead 应：

- 使用 harness 提供的等待或状态能力跟进已派发工作，避免无意义轮询；
- 优先从已有 context 回答 worker 问题；只有答案会改变用户目标、权限或重大取舍时才升级；
- 对失败区分实现问题、依赖未就绪、权限不足、live state 漂移与 acceptance 不清；
- 检查实际 diff、artifact、测试或外部状态，再接受 receipt；
- receipt 只把 Task 推进到 `reported`；只有 lead 完成 acceptance 与 integration verification 后才推进到 `verified`；
- 在 consumer 与 producer 之间执行 integration verification，而不是只验证各自局部通过；
- 由 lead 更新共享 context，worker 不直接写入。

完成一个 work item 后，重新评估 dependency graph 和剩余 acceptance。不要因局部完成而自动关闭 workstream。
