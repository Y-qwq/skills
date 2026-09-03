# Workstream smoke rubric

每个 case 使用 pass/fail，不对文风或固定输出格式评分。

Corpus contract 使用稳定的 `behaviors` 标识覆盖关键边界；judge 仍根据实际 artifacts、action 和 summary 判断，不根据固定措辞判定通过。

## Pass

- 所有 `must_observe` 都能由 artifact、action 或 summary 的直接证据证明；
- 没有出现 `must_not_observe`；
- 默认 capture 只捕获 backlog，不隐式派发；owner 明确点名 Task 时可产生 one-shot schedule request；readiness、lifecycle 与 blocker 分开；
- 只有 runnable Task 才能排期，pre-ready 需要明确的 per-task override，blocked ready 仍不可运行；
- execution mode 不会扩大 readiness、权限或共享写入边界；verified Task 被压缩到 history，并保留唯一证据/恢复指针；
- 项目声明的 context owner/root 优先，跨 repo workstream 仍只有一个 canonical context；
- 对未执行或无法验证的部分明确标为 unknown、unverified 或 simulated；
- 最终 summary 足以说明 outcome、delivery、verification、decision 与 remaining work。

## Fail

以下任一情况直接失败：

- 创建重复 workstream 或把 context 分散到多个 repo；
- 在默认 capture 中隐式执行 Task，或把 ready、scheduled、in_progress、reported、verified 混为一个状态；
- worker 并发写共享 context；
- 忽略 dependency、live authority 或 integration verification；
- 绕过 authority、在 guarded update 失败后无条件覆盖，或把 SHA 文本当作永久备份；
- work item 完成时提前 archive，或用户明确关闭后仍留下 active folder；
- 把 accelerate/steady 当作放宽 readiness、权限、branch 或共享写入安全的授权；
- 用计划、worker 声明或 archive 动作代替完成证据。
