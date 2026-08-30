# Request

`WorkspaceStatus` 在 workspace 数据完全没变时，仍会跟着 app shell 的时钟每秒 rerender。Profiler 已确认更新来自 Context value 的变化，而不是 consumer 自己的 props；父级时钟必须保留。

请 review `fixture/WorkspaceContext.tsx`，给出保持现有 Context public shape 的最小修复，并解释为什么有效。

项目事实：

- `workspace` 对象在这些时钟更新之间保持同一引用。
- 这个 package 没有启用 React Compiler。
- Provider 已经只包裹 workspace route，它的 scope 和 state owner 是有意设计，本次不调整。
- `workspaceApi.refresh` 是稳定的模块函数。
