# Delivery and recovery

## Authority model

一个有后果的 action 必须同时满足：

```text
user-granted scope ∩ active harness authority ∩ target-system policy
```

Harness authority 是能力上限，不单独证明用户希望执行该 action。另一方面，不要因为 action 属于 push、merge 或其它可变更操作，就在已有授权之外发明统一禁令或重复确认。

从 live repository metadata、保护规则和用户 policy 判断 default、release、protected 或 shared branch，不凭 branch 名字猜测。权限、ownership、影响面或恢复能力仍有实质歧义时才暂停并升级。

## Before consequential mutations

执行前确认并记录：

- 精确 target 与当前 observed version；
- target 的 owner，以及是否存在并发 writer；
- 下游 branch、PR、consumer、automation 或环境影响；
- 失败或误操作后的恢复路径；
- 用户要求的 acceptance 与停止条件。

状态容易漂移时，在 mutation 前即时刷新，不使用 session 启动时或旧 context 中的快照。

## History rewriting

不要把 history rewriting 写成绝对禁令。Workstream-owned target 在 scope、harness 和 repository policy 允许，且并发影响与恢复路径明确时可以执行。

对于 Git：

1. 读取并记录 remote、ref 与实际 remote SHA；
2. 确认旧对象存在可用的恢复来源。文本中的 SHA 只是 pointer；需要恢复保障时，应确保对象仍被 live ref、PR retention、backup ref 或保留 clone 持有；
3. 记录 intended new SHA、原因和受影响 PR 或 downstream branch；
4. 优先使用带明确 expected SHA 的 guarded update，例如 `--force-with-lease=<ref>:<observed-sha>`，而不是无条件 force；
5. guarded update 因 remote drift 失败时，重新读取 remote state 并评估，不自动降级为无条件覆盖；
6. 成功后回读 remote ref，并将 before、after 与验证写入 receipt。

对非 Git 系统使用等价的 conditional update、version check 或 compare-and-swap 能力。

## Verify delivery

Worker 的完成声明、命令成功或局部测试只证明它们实际覆盖的范围。Lead 根据 acceptance 选择证据：

- 检查真实 diff、artifact、API/schema 或目标系统状态；
- 运行与变更风险相称的测试、lint、typecheck、build 或 runtime check；
- 验证 producer 与 consumer 的集成 contract；
- 区分 static、local、CI、runtime、release 与 production evidence；
- 明确记录未运行、不可用或仍不确定的验证。

跨 repo delivery 需要记录每个交付物的链接或 ref、依赖顺序和最终集成状态。

## Report

面向用户的 summary 优先回答：

1. 达成了什么 outcome；
2. 哪些交付物发生变化；
3. 怎样验证；
4. 做了哪些会影响后续的判断；
5. 还剩什么、为什么尚未完成。

操作细节只在其解释风险、恢复或未完成状态时保留。
