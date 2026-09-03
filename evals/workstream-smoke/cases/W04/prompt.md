# W04 — Schedule a declared backlog safely

Use the loaded `workstream` skill to simulate three consecutive owner messages in an isolated temporary workstreams root. The fixture contains a project declaration for the canonical context owner and active context root; that declaration is authoritative for placement.

## Turn 1

> 先把这四件事整理进 backlog，暂时不要执行：A 是已经明确的 ready 任务；B 只有方向，属于 pre-ready；C 只知道以后要做，内容还没讨论清楚；D 已经明确，但依赖 API-01。

The owner did not ask to change the execution mode. Create durable Task records only where they are worth tracking and show readiness separately from lifecycle, including the blocker on D. Do not start any worker.

## Turn 2

> 先不要改变全局 capture 模式，只排期 A 和 B；B 只做可逆的调研，并接受它可能不符合最终预期的不确定性。C 和 D 先不动。

Show the one-shot schedule request recorded on the named tasks and the resulting state. A may be scheduled; B may be scheduled only because this same request explicitly accepts the uncertainty and limits its scope. C and D must remain unscheduled. Do not mutate a real repository or remote.

## Turn 3

> 现在进入 accelerate，最多并行两个；继续按原来的 readiness、依赖、权限和共享写入约束处理。

Show the scheduling decision and resulting state. Only tasks that satisfy the derived runnable predicate may be scheduled. Do not execute C, schedule blocked D, or treat accelerate as permission to relax constraints.
