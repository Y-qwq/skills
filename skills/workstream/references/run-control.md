# Run control

Run 是一次被授权的有界推进，不是长期目标，也不是宿主 session 的状态副本。一个大目标可以跨多次 Run 保留，预算不足时不缩小业务验收口径、不伪造完成。

## Canonical controls

Run 控制只保存在 `state.md` frontmatter 的 `run` 中；重建正文 projection 时原样保留：

```yaml
run:
  status: idle # idle | running | draining | paused
  stop_reason: null
  resume_condition: owner-request
  stop_verification: null
  no_progress_cycles: 0
  last_notice: null
  budget: null
```

- `idle`：没有启动持续执行；不因 backlog 非空而自动运行。
- `running`：当前授权、预算和宿主能力允许推进。
- `draining`：已关闭新派发，仅允许有界收尾、收取已在途的结果、保存 checkpoint 和停止驱动；不能启动新测试批次或重试。
- `paused`：本轮已停机，或启动前被拒绝且驱动未启动。`stop_verification` 记录实际 target、停止/未启动证据与 observation 时间；发出暂停请求不是证据。

`stop_reason` 区分 budget、budget-unknown、no-progress、waiting、owner-pause、stop-unavailable 等原因；不是 Task 的 blocker，也不把 execution mode 改成 capture。宿主仍活跃而无法暂停时保持 draining，不谎称已停机。仅明确的用户执行/恢复请求，或事先授权且实际满足的恢复事件，才能重新做准入；自动 tick、状态查询或无授权的额度重置均不算恢复。

## Start before promising autonomy

1. 明确本次 Run 的有界产物或检查点、预算约束与收尾要求。大 Goal 由 Lead 自主拆批，不把拆解责任交回用户。
2. 根据当前工具契约，确认停止谁、用什么入口、怎样回读已停止；还要覆盖在途 worker。暂停权限、动作成功和停止证明是三件事。原生 Goal 只承担有独立验收的批次，不承担永久保活。
3. 硬额度保留还需要宿主能约束该额度窗口下的累计消耗与在途工作；仅有 token budget 或暂停按钮，不能直接保证账户百分比。能力不可用或无法验证时不启动无界无人值守循环，提供有界单次执行或经用户接受的尽力预算方案。

本 skill 不提供宿主停机 API。不得臆造工具、把暂停命令当普通聊天消息发送、改内部数据库，或用 complete/blocked 冒充额度暂停。Goal 只能在真实目标达成或符合宿主的真实阻塞规则时更新对应状态。

## Budget admission

只有用户提出额度约束时才填 `budget`：记录实际 window/账户范围、`reserve_percent`、`drain_margin_percent` 及其依据；3% 只是一次用户要求，不是全局默认。选择何种额度源与刷新时机遵循当前宿主，不从 token 数猜账户百分比。

- 派发前和耗时操作后核验选定窗口的真实用量；缺失、过期或来源不匹配时停止新派发，不能把 unknown 当充足。
- 剩余量不大于 reserve + drain margin 时进入 draining。余量必须覆盖 Lead、worker、验证、必要清理、交接和驱动停止；不能把留给用户的 reserve 当作收尾预算。
- 固定 1% 缓冲不是保证。无法约束在途消耗时缩小批次/并发或提前停派；共享账户中其它工作也可能消耗额度，不能承诺控制范围外的保证。
- 保存暂停原因后，不在每次自动唤醒中重查同一个不足额度。只有满足已授权的恢复条件后才重新核验；不擅自兑换重置额度。

## Event handling

| 输入 | 最小动作 |
| --- | --- |
| 新需求 | 更新相关 scope/backlog；不自动解除暂停 |
| 用户执行/恢复 | 重新核验授权、额度和停机能力；通过后才进入 running |
| worker 回报 | 只处理该 attempt 的证据和必要清理；draining 时不自动派发后继 |
| 自动唤醒，无新事件 | 先读 Run gate；暂停则不重读历史、不查额度、不重新规划、不重复通知 |
| 等待在途工作 | 用宿主事件或阻塞等待，不用模型反复生成状态消息 |
| 无可执行工作且无在途工作 | checkpoint 后停止驱动，记录具体恢复条件 |
| 用户状态查询 | 返回现有 checkpoint 和未验证项；不暗中恢复执行 |

进展是新增可验收产物、测试/调查证据或解决了实际决策/阻塞，不是重复读文件、查额度或改写看板。连续两次工作周期没有这类进展时，停止当前策略；有在途工作用等待机制，否则停止驱动并记录下一步。正常阻塞等待不计为无进展周期。

## Stop and resume

关闭准入 → 指示在途 worker 到安全检查点停止 → 用提前预留的余量完成必要清理并保存交接 → 调用已验证的宿主停机入口并确认 → 记录 paused。

收尾失败保留恢复指针和未验证状态，不为“完整收尾”无限续跑。停机事件只通知一次，`last_notice` 保存原因/检查点标识供去重；不把消息去重当作停机。宿主继续发送 tick 本身可能消耗 token，必须由宿主/外部驱动停止唤醒，不能靠另一轮 LLM 自检解决。

恢复时先核验新的执行授权与当前能力，只加载待继续的 Task/attempt；不重做已有完整证据，不清除未解决的额度保护。新 Run 清除上一轮的停止证明和 notice，保留历史 checkpoint。长期 Workstream、未完成 Task 和既有验收口径保持不变。

## Existing context

这是 schema v2 的可选执行控制扩展，不重编号 AC/AT/RV，不迁移旧 receipts。首次使用时只为现有 state 补 Run 控制。旧记录若包含额度停止/暂停意图，先关闭准入：驱动仍活跃时为 draining，已确认停止时为 paused；未知时不能假定 running。普通旧 capture context 初始化 idle。不得仅因升级 skill 自动启动 Goal 或修改真实测试环境。
