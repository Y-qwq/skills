# Workstream smoke evaluations

这组最小 corpus 验证 `workstream` schema v2 的 backlog-first 行为边界：默认捕获而不执行、按 one-shot request 调度、拆分 readiness 与 lifecycle、可重入迁移旧 status、typed dependencies/blockers、不可覆盖的 `AT-*` 多次 attempt、失败后的 retry/blocker/cancel/supersede、按 execution mode 调度、恢复后协调依赖、执行可恢复 mutation、压缩已验证 Task、按 `scheduled + in_progress + reported` 计算默认 WIP=4，以及用 evidence-first、incremental 的 Lead verification 避免重复 worker 工作。它还验证 `RV-*` owner attention queue、只有 active `decide` 可成为 blocker、从 Task blocker 反向派生 blocking scope、每轮 Lead closeout，以及只在用户明确完成时清理。

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
