---
name: react-best-practices
description: >
  Use whenever implementing, refactoring, reviewing, or debugging React runtime behavior involving
  Effects, dependencies and cleanup, stale closures, refs, derived values, memoization or React Compiler,
  custom Hook lifecycle behavior, Context value identity and re-renders, Strict Mode, or renderer
  integration. Apply proactively during broader React reviews when these runtime concerns are present.
  Not for component or Hook API design, composition, state ownership, Provider scope, abstractions,
  module boundaries, or file organization; use frontend-architecture-guide.
---

# React Best Practices

优先遵循 React 的 render/commit 与数据流语义，再考虑使用 escape hatch（逃生舱）。Effect 用于连接外部系统，ref 用于不参与 render 的可变值，手动 memoization 用于 React Compiler 未覆盖或存在明确 identity/performance contract 的边界。应根据项目的 React Compiler、renderer 和既有 data layer 调整做法，不要机械照搬示例。

本 skill 只负责 React 运行时语义。Component 或 Hook API、composition、state/action ownership、Provider scope、abstraction、module boundary 与文件归属由 `frontend-architecture-guide` 负责。只有任务同时包含独立的结构判断和运行时判断时才共触发；纯运行时问题不会因为目标文件是 component 或 Hook 而自动加载 Architecture。

## 开始前确认

修改代码前：

1. 阅读仓库级指令与相邻代码约定。
2. 确认是否启用 React Compiler，以及 compilation mode 是否覆盖目标 component 或 Hook。
3. 确认 renderer：React DOM、React Native，或同时支持两者的共享 package。
4. 确认项目现有的数据请求归属，例如 framework loader、query library 或 client cache。

不同 renderer 的 API 不能直接互换：`window`、DOM node 和 `flushSync` 属于 React DOM；native 事件订阅和命令式 host method 应遵循 React Native contract。

## Effect 是 escape hatch

Effect 用于“走出” React，与外部系统同步。编写 Effect 前先判断：

1. 响应用户交互：使用 event handler。
2. 根据 props/state 计算值：在 render 阶段直接计算。
3. 缓存计算结果或保持 identity：先遵循 React Compiler 策略；只有存在具体收益或 contract 时才手动 memoization。
4. props 变化时需要重新创建本地 state：使用 `key` 表达实例边界。
5. 与外部系统同步：使用 dependency 完整且 cleanup 对称的 Effect。
6. 获取数据：使用项目既有 data layer；只有没有合适 owner 时才在 Effect 中请求。
7. Effect 中需要读取最新 commit 的 non-reactive 值：考虑 `useEffectEvent`。
8. 保存不触发 render 的可变值：使用 ref。

手动请求必须处理过期响应与 cleanup。项目已有 data layer 时，不要在 component 内重复实现缓存、请求去重、重试或防止请求瀑布。

## Dependency、Cleanup 与 Closure

- Dependency list 应准确描述会触发重新同步的 reactive input；先修正 Effect 结构，再考虑 lint suppression。
- Setup 与 cleanup 必须对称，包括 Strict Mode 在开发环境执行的额外 setup-cleanup cycle。
- 使用 updater function、把 object/function 移入 Effect，或使用 `useEffectEvent`，应基于真实同步 contract，而不是隐藏 stale closure。
- `useEffectEvent` 只承载属于 Effect、但不应触发重新同步的逻辑；不要把 reactive dependency 偷渡进去，也不要从 render 或其他 component 调用它。

## Derived Values 与 Memoization

- 派生值在 render 阶段计算，不用 Effect 镜像成另一份 state。
- React Compiler 覆盖目标代码时，默认直接编写计算和函数，让 Compiler 处理 memoization。
- 未覆盖或跳过编译时，只有存在可测量 render 成本或明确 identity contract，才使用 `useMemo`、`useCallback` 或 `memo`。
- Effect、native/third-party identity boundary，以及 profiler 证明编译产物不足时，手动 memoization 可以作为 escape hatch。
- Memoization 只能优化性能或满足外部 identity contract，不能成为业务正确性的前提。

## Context Runtime Behavior

本 skill 只检查 Context 的运行时传播，不决定 Provider 放在 route、feature 还是 app scope：

- 区分 consumer rerender 是由 Provider `value` identity 改变、实际读取的数据改变，还是 parent render 引起。
- React Compiler 未覆盖或外部 identity contract 需要显式控制时，可稳定 Provider `value` 与 callback；先用 profiler 证明问题。
- 不要假设 `memo` 能阻止 consumer 响应其读取的 Context value 更新。
- 若解决方案涉及拆分 Context contract、移动 Provider 或改变 state/action owner，转由 `frontend-architecture-guide` 判断。

## Ref 与 Imperative API

- Ref 用于不影响 render 的值，例如 timer ID、host node reference 和 imperative handle。
- 避免在 render 阶段读写 `ref.current`；窄例外是结果稳定、行为可预测的一次性初始化。
- 动态列表使用 ref callback，不要在循环中调用 `useRef`。
- 使用 `useImperativeHandle` 限制调用方可访问的命令式 API。
- UI 依赖的数据应放在 state 中，不能用 mutable ref 绕过 render。

## Custom Hook Runtime

- 每次调用 Custom Hook 都拥有独立的 state 与 Effect 实例；Hook 共享逻辑，不共享运行时实例。
- 只有实际调用其他 Hook 的函数才命名为 `useXxx`。
- `useMount`、`useEffectOnce` 只能表达真实的 once-per-mount contract，并且必须保留 cleanup。
- Lifecycle wrapper 不得隐藏 reactive dependency，也不得用来规避 Strict Mode 的额外 setup-cleanup 检查；若捕获值应触发重新同步，改用 dependency 明确的 Effect 或调整 contract。
- Hook 的公开 API、职责拆分和 feature/file 归属属于 Architecture，不在本 skill 中决定。

## Review Checklist

- 每个 Effect 是否在同步外部系统，或有明确理由承担手动请求？
- Dependency 是否完整，closure 是否读取了与同步 contract 不一致的旧值？
- Setup 与 cleanup 是否对称，并能通过 Strict Mode 的开发期检查？
- Derived value 是否避免了 Effect 镜像和重复 state？
- 手动 memoization 是否符合 Compiler 覆盖情况，并有性能或 identity 证据？
- Context rerender 是否定位到 value identity 或真实数据传播，而不是误判 Provider scope？
- Ref 是否只保存不参与 render 的值，imperative API 是否与 renderer contract 一致？
- Custom Hook lifecycle 是否暴露 dependency、cleanup 和 once-per-mount 语义？

需要具体运行时示例时，按需读取 [react-patterns.md](react-patterns.md)。其中明确标注了 Shared、React DOM 和 React Native 的适用范围。
