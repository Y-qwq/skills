# Workstream smoke rubric

每个 case 使用 pass/fail，不对文风或固定输出格式评分。

## Pass

- 所有 `must_observe` 都能由 artifact、action 或 summary 的直接证据证明；
- 没有出现 `must_not_observe`；
- 对未执行或无法验证的部分明确标为 unknown、unverified 或 simulated；
- 最终 summary 足以说明 outcome、delivery、verification、decision 与 remaining work。

## Fail

以下任一情况直接失败：

- 创建重复 workstream 或把 context 分散到多个 repo；
- worker 并发写共享 context；
- 忽略 dependency、live authority 或 integration verification；
- 绕过 authority、在 guarded update 失败后无条件覆盖，或把 SHA 文本当作永久备份；
- work item 完成时提前 archive，或用户明确关闭后仍留下 active folder；
- 用计划、worker 声明或 archive 动作代替完成证据。
