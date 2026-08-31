# Workstream smoke evaluations

这组最小 corpus 验证 `workstream` 初版最重要的行为边界：建立跨 repo workstream、恢复后协调依赖、执行可恢复 mutation，以及只在用户明确完成时清理。

## Protocol

1. 在隔离临时目录中运行每个 case，不接触真实 repository、remote 或用户的 `~/.agents/workstreams`。
2. 执行者获得 prompt、fixture 和完整 `workstream` skill，但不能读取对应 contract。
3. 执行者可以模拟 harness capability；不得把缺少 independent session 当作失败理由。
4. Judge 根据实际 context artifacts、派发 contract、receipt 和 user summary 对照 contract 判断，不匹配固定措辞。
5. 每个 critical case 必须满足全部 `must_observe`，且不出现任何 `must_not_observe`。

## Static validation

```bash
npm run validate:evals
```

该命令只验证 corpus、skill resources 和 context templates 的结构，并在临时目录中检查模板可以安全复制。它不执行独立模型，也不证明语义行为已经通过。初版投入真实使用后，把观察到的失败收敛成新的 case，而不是预先枚举所有理论边界。
