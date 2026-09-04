# Workstream smoke rubric

每个 case 使用 pass/fail，不对文风或固定输出格式评分。Corpus contract 使用 schema v2 的结构化字段验证行为，不把出现某个词当作实现证据。

Corpus contract 使用稳定的 `behaviors` 标识覆盖关键边界；judge 仍根据实际 artifacts、action 和 summary 判断，不根据固定措辞判定通过。

## Pass

- 所有 `must_observe` 都能由 artifact、action 或 summary 的直接证据证明；
- 没有出现 `must_not_observe`；
- 默认 capture 只捕获 backlog，不隐式派发；owner 明确点名 Task 时可产生 one-shot schedule request；readiness、lifecycle 与 blocker 分开；
- 默认策略为 `capture + wip_limit: 4`；WIP 只计算 `scheduled`、`in_progress`、`reported`，明确排除 `backlog`、`verified`、`cancelled`、`superseded`；
- 只有 runnable Task 才能排期，pre-ready 需要明确的 per-task override，blocked ready 仍不可运行；
- schema v2 使用稳定 `AC-*` acceptance IDs、`AT-*` attempt receipts 和 `RV-*` review IDs；Task contract 使用 typed `dependencies`/`blockers`，不使用多个 current truth 字段；
- Task dispatch contract 指定 `verification_depth`，默认 `targeted`，并提供逐项 acceptance/claim 的 required evidence 规格（kind、subject、required environment、command/source、freshness/ref requirement）与 producer-consumer integration gates；不要在执行前伪造 actual ref/version；
- Worker receipt 将 required evidence 与 observed evidence 分开，提供带精确 ref/version/environment、command/source、result、observed_at、limitations/unverified gaps 和 recovery pointer 的 claim-evidence mapping；worker validation 与 Lead verification 分开，并结构化记录 requested/effective depth、outcome、decided_at、verified_at、escalation trigger 和 additional checks；
- Lead 先审计 evidence binding、acceptance coverage、integration coverage；证据充分时只消费既有证据，不重复 worker 的完整调查或验证；
- `receipt-only` 只审计可追溯证据，`targeted` 在审计后补关键检查，`independent` 独立复现核心结论；Lead 只能按记录的风险触发器升级，不能静默降级；
- 只有 evidence 缺失/过期/矛盾、acceptance 或 integration 缺口、live state 漂移、flaky 信号、高风险/不可逆影响、worker 未验证缺口或 owner 要求独立复核时，才扩大验证；
- Worker failed/blocked 后，Lead 必须把 Task 明确退回 `backlog` + retry/typed blocker，或设置 `cancelled`/`superseded`；新 attempt 只能创建新 `AT-*` receipt，不能覆盖旧 evidence；
- Review 是 owner attention queue，不是默认审批 gate；`inspect`/`advise` 不得阻塞，只有 `queued`/`presented` 的 active `decide` 可在 Task `blockers[].ref` 明确引用时阻塞；Review 不计 WIP，blocking scope 从 Task 反向派生；
- 每轮 Lead closeout 都展示 mode/WIP、backlog counts、hot tasks、this-turn changes、Task blockers 和 owner attention；大量内容用索引/阅读成本/推荐顺序并支持 owner 点选，不持久化 session status；
- execution mode 不会扩大 readiness、权限或共享写入边界；verified Task 被压缩到 history，并保留唯一证据/恢复指针；
- 项目声明的 context owner/root 优先，跨 repo workstream 仍只有一个 canonical context；
- 对未执行或无法验证的部分明确标为 unknown、unverified 或 simulated；
- 最终 summary 足以说明 outcome、delivery、verification、decision 与 remaining work。

## Fail

以下任一情况直接失败：

- 创建重复 workstream 或把 context 分散到多个 repo；
- 在默认 capture 中隐式执行 Task，或把 ready、scheduled、in_progress、reported、verified 混为一个状态；
- 把 backlog、verified、cancelled 或 superseded 计入 WIP，或把 WIP=4 当作 capture 自动开工信号；
- 缺少结构化 claim-evidence mapping，或用 worker 的声明、命令成功和局部通过代替可追溯证据；
- 在 Task required evidence 中预填尚不存在的 actual ref/version，或混淆 requested 与 effective verification depth；
- Lead 在没有风险触发器时重复 worker 的完整调查/测试，或跳过 acceptance/integration coverage；
- 把 `receipt-only`、`targeted`、`independent` 混为一谈，静默降低声明的 verification depth，或没有记录升级理由；
- worker 并发写共享 context；
- 忽略 dependency、live authority 或 integration verification；
- 绕过 authority、在 guarded update 失败后无条件覆盖，或把 SHA 文本当作永久备份；
- work item 完成时提前 archive，或用户明确关闭后仍留下 active folder；
- 把 accelerate/steady 当作放宽 readiness、权限、branch 或共享写入安全的授权；
- 用计划、worker 声明或 archive 动作代替完成证据。
- 用 `review.related_tasks` 或 review-owned `blocks` 字段代替 Task `blockers[]` 的 canonical truth；
- 让 inspect/advise/terminal review 成为 Task blocker，把可选 review 变成审批 gate，或因 owner 尚未阅读而停止无关工作；
- 覆盖旧 attempt receipt、把 failed/blocked receipt 直接标成 verified，或用 `verified_at` 记录 retry/blocked/cancelled/superseded decision；
- 将 closeout/session status 持久化为额外 Task 或 lifecycle，或把 review 数量计入 WIP。
