# W05 — Verify receipts without repeating worker work

Use the loaded `workstream` skill to simulate three consecutive owner messages against the active workstream represented by the fixtures. The fixture contains a default capture policy, four hot tasks, two worker receipts, and a high-risk task that will later return a weak receipt. Do not contact a real repository or remote.

## Turn 1

> 先审核现有两个 receipt，判断哪些可以验收。保持 capture，不要因为还有排期容量就启动 backlog；也不要从头重复 worker 已经有充分证据支持的调查和测试。

Audit the claim-evidence mappings, current refs/versions/environments, acceptance coverage, and integration gates. Show the evidence-first decision and leave scheduling unchanged.

## Turn 2

> 现在把 R-01 和 R-02 验收；必要时只补关键的 integration check。验收完成后切到 steady，尝试排期 B-01，并说明 WIP 是怎么计算的。

Use `receipt-only` for the complete low-risk receipt and the default `targeted` depth for the receipt with an integration gap. Do not rerun the worker's complete local validation suite. After verification, schedule only what the effective WIP limit and runnable predicate allow.

## Turn 3

> SEC-01 涉及权限迁移，worker 刚返回 receipt 并声称通过。按 independent 深度验证核心结论；如果证据不足就保持 reported，不能静默降级。

Treat the new security receipt as reported work. Apply the high-risk and evidence-gap escalation rules, record the independent verification or the remaining gap, and keep the workstream active.
