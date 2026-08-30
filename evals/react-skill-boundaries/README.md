# React Skill Boundary Evaluations

这组 corpus 用于回归 `frontend-architecture-guide` 与 `react-best-practices` 的触发、职责边界、渐进披露和实际回答质量。

## 运行协议

1. Routing：执行 agent 只看候选 skill descriptions、同一组 distractor descriptions 和 `routing/cases.jsonl`；不得读取 skill 正文或 `routing/expected.json`。每条请求使用三个独立 agent。
2. Forced-load behavior：执行 agent 获得完整 prompt、fixture 与应加载的 skill，但不得读取 contract。它必须记录实际加载的 references。
3. End-to-end：执行 agent 先只根据 descriptions 选择 skill，再加载所选正文并回答；critical 案例运行三次。
4. Blind judging：judge 只获得匿名 X/Y 输出、prompt、fixture、contract 和 `rubric.md`，不得读取 skill、commit 或版本映射。
5. A/B 比较使用相同模型、推理强度、案例和重复次数。保留未入仓的 holdout，避免只针对公开 corpus 调整文案。

`routing/cases.jsonl` 与 `behavioral/cases/` 是执行输入；`routing/expected.json` 与 `behavioral/contracts/` 只能提供给 judge。不要把模型输出、匿名映射或临时日志提交到仓库。

## 校验

```bash
npm run validate:evals
```

该命令只校验 corpus 的结构、路径、contract schema 和 routing 分布。语义评估需要按上述协议运行独立 agent；CI 通过不代表 LLM behavior 已自动通过。
