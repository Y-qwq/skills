# Workstream smoke evaluations

W01–W07 验证 schema v2 的 backlog、调度、迁移、证据验收和 owner attention。W08–W09 验证预算停派、宿主停止证明、重复唤醒、明确恢复与停机能力不足时的准入行为。Closeout 只在有变化或用户查询时输出，不作为每次唤醒的必做动作。

## Protocol

1. 在隔离临时目录中运行每个 case，不接触真实 repository、remote 或用户的 `~/.agents/workstreams`。
2. 执行者获得 prompt、fixture 和完整 `workstream` skill，但不能读取对应 contract。
3. 执行者可以模拟 harness capability；不得把缺少 independent session 当作失败理由。
4. Judge 根据实际 context artifacts、派发 contract、receipt、Lead 的验证动作和 user summary 对照 contract 判断；检查 claim-evidence mapping、ref/version/environment、acceptance coverage、integration gates、WIP 投影和实际重复工作，不匹配固定措辞。
5. W06 覆盖多次 attempt 与失败恢复；W07 覆盖 owner attention 与 closeout。它们还提供 machine-readable expected post-conditions，供 semantic validator 检查跨实体关系，而不是只匹配描述文字。每个 critical case必须满足全部 `must_observe`，且不出现任何 `must_not_observe`。

## Static validation

```bash
npm run validate:evals
```

该命令验证 corpus、behavior coverage、skill resources、context templates，以及 W06/W07 expected state 的 lifecycle/attempt/review/WIP/closeout 关系，并在临时目录中检查模板可以安全复制。它不执行独立模型，也不证明 Skill 的实际生成行为已经通过；完整 forward eval 仍需让模型执行 blind case，再把生成目录交给同一组 semantic invariants。投入真实使用后，把观察到的失败收敛成新的 case，而不是预先枚举所有理论边界。

## Low-cost run regression

```bash
npm run test:run-control
node scripts/validate-workstream-run.mjs evals/workstream-smoke/cases/W08/fixture/events.json evals/workstream-smoke/cases/W08/expected.json
```

这些检查只读本地 JSON，不调用 LLM、真实 Goal、额度接口或生产环境。测试既验证合法轨迹，也故意注入事故行为：重复通知、触线派发、虚假暂停、无能力启动、无授权恢复和连续无进展。它验证的是轨迹判断契约，不是一个新的运行调度器。

需要行为抽查时，仅运行 W08/W09 一次短的 blind pass：执行者只得到 skill、prompt 和 fixture，不得读取 expected、contracts 或校验器；输出 steps 数组，不实际执行动作。Judge 用不可改的 fixture 和生成的 steps 调用同一校验器，再人工核对能力限制说明。不要让被评测者自填宿主事件或停机证明。

本地通过不证明宿主真的停止了；真实无人值守前仍须验证宿主控制能力。模型抽查不默认重跑整个 corpus、做多模型矩阵或循环调参；需要更大评测投入时先说明成本。
