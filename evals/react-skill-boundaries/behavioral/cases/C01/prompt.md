# Assignee picker API review

请 review `AssigneePicker` 的公开 API 和 state 边界。它现在被两个入口复用：工单编辑页由父组件保存 assignee；快速创建抽屉希望 picker 自己维护草稿，并允许提供初始 assignee。

补充约束：

- `null` 表示用户明确选择“Unassigned”，与未传 prop 不同。
- 工单编辑页可能在不卸载 picker 的情况下切换到另一张工单。
- “Cancel” 后再次打开必须恢复各入口自己的已保存值。
- 两个入口都需要收到选择变化，以便更新 dirty state 或 analytics。

请指出当前 contract 中容易产生歧义的地方，并给出你会采用的 API 与 ownership 方案。不要假设必须兼容现有 prop 形状。
