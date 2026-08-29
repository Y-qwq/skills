---
name: frontend-architecture-guide
description: >
  Use whenever designing, refactoring, or reviewing React frontend structure, including component and
  custom Hook boundaries, state ownership or Provider scope, abstractions, feature/module organization,
  layered architecture, or where state, logic, and files should live. Apply proactively during broader
  React reviews when these structural concerns are present, even if the user did not explicitly ask an
  architecture question. Not for Effect dependencies, cleanup, refs, memoization, stale closures, or
  other React runtime semantics; use react-best-practices.
---

# Frontend Architecture Guide

一套主动审查 React 结构的决策框架。目标是让 ownership、公开 contract 和依赖方向清晰，而不是套用固定目录模板。只要设计、重构或 review 涉及 component、custom Hook、state、Provider、abstraction、feature/module 或文件归属，就应主动使用本 skill，即使用户没有直接提出架构问题。

## 职责边界

本 skill 负责结构判断：

- component 与 custom Hook 的职责、公开 API 和拆分边界
- controlled / uncontrolled contract、composition、compound component 与 prop drilling
- state/action ownership、提升时机与 Provider scope
- abstraction、feature/module、layer 和文件归属

Effect dependency、cleanup、stale closure、ref、memoization、Strict Mode、renderer integration 等 React 运行时语义由 `react-best-practices` 负责。只有 Hook 内确实存在 Effect、cleanup、closure、ref、render/commit 等运行时问题时才搭配该 skill；仅仅涉及 component 或 custom Hook 文件不构成共触发理由。

## 核心判断原则

### 责任边界来自 change axis 与业务不变量

如果两个彼此独立的需求会反复修改同一个 unit，或同一业务不变量散落在多个 owner 中，应重新划分边界。不要因为文件变长、代码看起来相似或预想将来可能复用就拆分。

使用方应能通过 props、返回值和导出的类型理解 contract，而不必阅读实现才能安全使用。抽象应让调用处更清晰，并让应该一起变化的业务决策只存在于一处；外观相似但业务意图不同的代码可以保持重复。

### Render branch 是 component identity 的信号，不是自动拆分规则

单个 prop 改变大块 render branch 时，检查它是否代表独立 change axis、不同业务不变量或不同使用方 contract。只有这些差异形成稳定边界时才拆 component；局部、同一职责内的显示分支可以保留。

Controlled / uncontrolled 不是优先级关系。根据 source of truth、允许的写入方、重置方式和使用方 contract 选择 API，并避免在同一个模糊接口中同时维护两套互相竞争的状态来源。

### Composition 应表达稳定结构

优先用 composition 表达不同 component family 和布局关系，而不是不断增加 boolean prop 或 optional prop。Boolean prop 导致完全不同的 identity、生命周期或 contract 时，考虑拆成命名清晰的 component；否则保留简单 prop。

当一组可复用 UI 需要共享 scoped state/action 时，可使用 compound component 与可见的 Provider boundary。不要为避免少量 props 传递就引入隐式依赖；prop drilling 只有在中间层不拥有也不使用数据、并持续妨碍边界理解时才是重构信号。

除非 config 本身就是需要存储、传输或由业务编辑的 domain 数据，否则直接组合 JSX，避免把 config array 扩展成带 renderer、callback 协议和隐式控制流的 mini-framework。

### State 跟随 source of truth 与生命周期

State 应归属于能够维护其不变量、处理写入并恢复它的最小稳定 owner。判断时同时检查：

- source of truth 在哪里
- 谁可以写入，冲突如何解决
- state 需要存活多久，卸载后如何恢复
- 哪些 consumer 必须共享同一次状态转换

跨 feature 使用只是重新检查 ownership 的信号，不会自动升级为 global state。根据 contract 在 URL、server cache、明确的 feature owner、scoped Provider 与 global store 之间选择。只有真正具备应用级身份和生命周期的数据才进入 global state。

### 依赖方向应体现 ownership

UI 可以依赖业务 contract；业务规则不应反向依赖具体 UI。Presentation 不直接拥有 API 编排或业务决策。是否需要 domain/application/presentation 等物理分层取决于真实复杂度，不应为了“架构完整”预先创建空目录或 pass-through layer。

## 层级与结构升级

只有任务需要选择或比较 Pure display、Small business component、Medium module、Complex page 等 module 层级，判断是否应建立或移除 domain/application/presentation 等 layer boundary，或者评估一次结构升级或降级时，才读取 [references/architecture-levels.md](references/architecture-levels.md)。State ownership、Provider scope、component/Hook API、feature/file 归属、composition 或 abstraction 判断本身都不是读取理由；即使同时存在 React 运行时问题，只要不需要做上述层级决策，也不要读取该 reference。

## Review Checklist

- 每个 state、action、业务不变量和生命周期职责是否有明确 owner？
- Component 或 Hook 的公开 contract 是否足以让使用方理解用法？
- 拆分是否对应独立 change axis，而不是机械响应文件长度或单个 render branch？
- Composition、Context 或 Provider 是否让依赖更清晰，而不是隐藏数据流？
- 跨 feature 数据是否按 source of truth、写入方、生命周期和恢复方式选择归属？
- 抽象是否集中业务决策并简化调用处，还是形成 config-driven mini-framework？
- 依赖是否指向 owner，层级是否与当前复杂度相称？
- 若同时加载 `react-best-practices`，是否确实存在独立的 React 运行时问题？
