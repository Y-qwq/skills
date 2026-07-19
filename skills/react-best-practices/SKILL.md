---
name: react-best-practices
description: >
  Use when implementing, reviewing, or debugging React Effects, dependencies, stale closures, refs,
  derived state, memoization, custom Hook lifecycle behavior, component data flow, composition, Context,
  or renderer integration. Not for styling or component, state, module, and file boundaries;
  use frontend-architecture-guide.
---

# React 最佳实践

优先遵循 React 的数据流模型，再考虑使用 escape hatch（逃生舱）。这是 React 对“必要时绕开通常的声明式或自动优化路径，以取得更直接控制”的称呼；它表示一种例外入口，并不等于错误用法。例如 Effect 用于连接 external system，手动 memoization 用于精确控制 compiler 未覆盖的边界。应根据项目的 compiler、renderer 和既有 data layer 调整做法，不要机械照搬示例。

本 skill 聚焦 React API 与 component data flow。Component 拆分、state layer、module boundary 和文件组织等架构问题，交由 `frontend-architecture-guide`。

## 开始前确认

修改代码前：

1. 阅读仓库级指令与相邻代码约定。
2. 确认是否启用 React Compiler，以及其 compilation mode 是否覆盖目标 component 或 Hook。
3. 确认 renderer：React DOM、React Native，或同时支持两者的 shared package。
4. 确认项目现有的数据请求归属，例如 framework loader、query library 或 client-side cache。

不同 renderer 的示例不能直接互换：`window`、DOM node 与 `flushSync` 属于 React DOM；native event subscription 与命令式 host method 应遵循 React Native contract。

## 核心原则：Effect 是 escape hatch（逃生舱）

Effect 用于“走出” React，与 external system 同步。**大部分 component logic 都不应使用 Effect。** 编写 Effect 前先问：“能否不用 Effect 完成？”

## 决策树

1. **响应用户交互？** 使用 event handler
2. **根据 props/state 计算值？** 在 render 阶段直接计算
3. **缓存计算结果或保持 identity？** 先遵循 compiler 策略；只有存在具体收益时才手动 memoization
4. **props 变化时重置 state？** 使用 `key` prop
5. **与 external system 同步？** 使用带 cleanup 的 Effect
6. **获取数据？** 使用项目既有 data layer；只有没有合适归属时才使用 Effect
7. **Effect 中需要 non-reactive logic？** 使用 `useEffectEvent`
8. **保存不触发 render 的 mutable value？** 使用 ref

## 何时使用 Effect

Effect 用于和 **external system** 同步，例如 browser API（WebSocket、IntersectionObserver）、React Native API（AppState、native event subscription）、third-party non-React library、平台事件监听，以及命令式 host object（video、map、native view）。

当 component 确实拥有该同步职责，且项目没有合适的 loader、query library 或 cache 时，data fetching 可以使用 Effect。手动 fetching 必须处理 stale response 与 cleanup。项目已有 data layer 时，不要在各 component 内重复实现 cache、deduplication、retry 或 waterfall prevention。

## 不应使用 Effect 的场景

- Derived state：在 render 阶段直接计算
- Expensive calculation：先直接计算，再遵循项目的 compiler 或 memoization 策略
- props 变化时重置 state：使用 `key` prop
- 响应用户事件：使用 event handler
- 通知 parent state 变化：在同一个 event handler 中同时更新
- Effect chain：直接计算 derived state，并在同一个 event handler 中完成更新

## Memoization 与 React Compiler

- **Compiler 覆盖目标代码：** 默认直接编写计算与 function，由 React Compiler 自动 memoization。
- **Compiler 未启用、跳过或未覆盖目标：** 只有存在可测量的 render cost 或明确的 identity contract 时，才使用 `useMemo`、`useCallback` 或 `memo`。
- **例外场景（escape hatch）：** Effect、native 或 third-party identity boundary，以及 profiler 证明 compiler 产物不足时，仍可手动 memoization。
- 不要机械删除 compiled code 中已有的 memoization；先验证行为与性能。
- Memoization 只能用于性能优化，不能成为业务正确性的前提。

## Effect Event

- 使用 `useEffectEvent` 前，确认已安装的 React 与 Hooks lint 版本支持它。
- 只把 `useEffectEvent` 用于属于 Effect、但需要读取最新 committed props/state 且不应触发重新同步的逻辑。
- Effect Event 只能从同一 component 的 Effect 或其他 Effect Event 中调用；不要在 render 阶段调用，也不要传给其他 component 或 Hook。
- 不要用 Effect Event 隐藏 reactive dependency。需要触发 Effect 重新同步的值仍应保留在 dependency list 中。
- Effect Event function 的 identity 有意保持不稳定，不应加入 dependency array。

## Ref

- 用于不影响 render 的值，例如 timer ID、host node reference、imperative handle
- 避免在 render 阶段读写 `ref.current`；唯一的窄例外是结果稳定、行为可预测的一次性初始化
- dynamic list 使用 ref callback，不要在 loop 中调用 `useRef`
- 使用 `useImperativeHandle` 限制 parent 可访问的命令式 API

## Custom Hook

- 共享 logic，而不是共享 state；每次调用都有独立的 state instance
- 只有实际调用其他 Hook 的 function 才命名为 `useXxx`，否则使用普通 function
- 当 once-per-mount 就是真实 contract，且团队已统一语义时，`useMount`、`useEffectOnce` 可以合理减少重复 template code
- 不要用 lifecycle Hook 隐藏 reactive dependency：callback 捕获的值若应触发重新同步，应改用带明确 dependency 的 `useEffect` 或重新设计 Hook API；同时保留 cleanup contract
- 每个 Custom Hook 聚焦一个具体 use case

## Component Pattern

- Controlled：parent 持有 state；uncontrolled：component 持有 state
- 优先通过 `children` composition，避免 prop drilling
- 用 boolean prop 切换大块 component tree（`isEditing`、`isThread`、`hideAttachments`）通常意味着 composition smell；不同 use case 优先拆成独立 composition
- 复杂 reusable UI 优先使用带 provider-scoped state/action 的 compound component，避免带大量 optional prop 的 monolithic component
- Context 既可用于 scoped component family，也可用于真正的 global state，前提是它定义了 descendant 使用的局部 interface
- UI variation 直接 render JSX；除非 config 本身就是真实 domain data，否则不要构建 config-array mini-framework
- 同级组件或 external control 需要共享同一组 state/action 时，提升 provider boundary
- 仅在 React DOM integration 必须于 state update 后同步读取 DOM 时，谨慎使用 `flushSync`

## Review 清单

- 每个 Effect 都在同步 external system，或是有明确理由的手动 fetching。
- Effect dependency 准确描述 reactive input；suppression 必须是例外且有说明。
- Setup 与 cleanup 相互对称，包括 development 环境额外执行的 setup-cleanup cycle。
- 手动 memoization 符合 compiler 策略，并有明确的性能或 identity 理由。
- Ref 没有让 render 依赖 mutable non-reactive state。
- 平台专属 API 与目标 renderer 一致。
- Fetching 遵循项目 data architecture；手动实现时已处理 stale result。

需要具体实现示例时，按需读取相对路径 [react-patterns.md](./react-patterns.md)。其中明确标注了 Shared、React DOM 与 React Native pattern。
