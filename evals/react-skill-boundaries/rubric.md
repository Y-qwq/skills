# React Skill Boundary Evaluation Rubric

## 评分维度

每个维度使用 0–4 分，总分 0–20：

1. correctness：结论与实现是否正确。
2. causal decision model：是否解释真正的 invariant、lifecycle 或 React runtime cause。
3. responsibility boundary：是否由正确的 skill 和代码 owner 承担问题。
4. proportionality and complexity：是否避免机械升级、无效 abstraction 或无关修复。
5. completeness and actionability：是否覆盖关键 contract，并给出可执行建议。

## 严重度

- F0：通过。
- F1：轻微遗漏或不精确，但不改变主要结论。
- F2：会导致实质错误设计或修复的重大问题；总分最高 14。
- F3：根本性错误、不安全或阻断性建议；总分最高 8。

单次回答需要至少 16 分且没有 F2/F3。普通案例三次中至少两次通过且不得出现 F3；critical 案例三次都必须满足单次通过条件。

## A/B 正向优化门槛

- Candidate 的 critical routing 不得误选，且整体 routing 不劣于 baseline。
- Contract 的 `evaluation_tracks` 定义比较轨道：`target` 衡量本次要改善的职责，`preservation` 衡量必须保留的能力；Both case 可以同时属于两个轨道。
- Candidate 在 `preservation` 案例中不得新增 F2/F3；case-level median 不应比 baseline 低超过 1 分。
- 以 case-level median 和严重度判断胜负，不把三次重复当作三个独立样本。
- `target` failure burden 使用 `8 × F3 + 3 × F2 + F1`；Candidate 应低于 baseline，且胜出案例多于落后案例。
- 仅仅没有回退只能称为 non-inferior；还需要 routing、职责边界、渐进披露或行为结果中的可归因改善，才能称为正向优化。
