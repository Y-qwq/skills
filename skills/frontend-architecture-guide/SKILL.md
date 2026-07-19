---
name: frontend-architecture-guide
description: >
  Use when designing, refactoring, or reviewing React frontend structure: component and custom Hook
  boundaries, state ownership or Provider scope, abstractions, feature/module organization, layered
  architecture, or where state, logic, and files should live. Not for Effect dependencies, refs,
  memoization, or stale closures; use react-best-practices.
---

# Frontend 架构指南

一套用于编写 **Simple**（而不只是 Easy）Frontend code 的决策框架。它强调架构判断：何时拆分、采用什么 granularity、以及如何组织 structure。

## 核心原则

这些是 guidelines，不是 rigid rules。应根据具体 context 做出判断。

### Responsibility 与 Boundaries

**1. Single Responsibility Principle**
如果两个无关的 business requirement 都会导致同一个 component/hook 被修改，就应该拆分。
> “如果 product 修改 feature X，这个文件会变吗？feature Y 呢？如果两者都会，就拆分。”

**2. Consumer 不需要阅读 source**
Consumer 应该只通过 interface（props / return values）就能完整理解用法。
> “为了正确使用它，你是否必须阅读 source code？”

**3. 单个 prop 不应改变 component identity**
如果某个 prop 会导致完全不同的 render branch，这实际上是多个 component 在伪装成一个。
> “移除这个 prop 后，剩余代码仍然说得通吗？如果不能，就拆分。”

**4. UI 与 logic 可分离**
替换 UI library 不应该要求重写 business logic。
> “logic code 是否 import 了 UI library？如果是，它们已经 coupled。”

### Data Flow 与 State

**5. State 应放在真正需要它的位置**
State 属于使用它的最小 scope。不要为了“以防万一”而 lift state。
> “删除这个 state 后，多少个 component 会坏？一个 = 保持 local；两个以上的 sibling = 放到 nearest common ancestor。”

根据 scope 和 lifetime 选择 state tool：

| | 谁需要访问 | 如何传递 | 常见工具 |
|---|---|---|---|
| Component state | 仅自身 | — | useState |
| Parent-child passing | Parent + direct children | 显式 props | Lift to parent |
| Scoped shared state | Subtree 内任意层级 | Implicit subscription | 遵循项目约定（Context、scoped store 等） |
| Global state | 跨 feature boundary | Implicit subscription | Global state management |

当 Provider boundary 在 component tree 中清晰可见时，implicit subscription 是可接受的。

### Complexity Control

**6. Structural abstraction 服务于清晰度，不是重复次数**
不要仅因为代码重复就提取 hook/component/file。看到三次重复时，先问：abstraction 能否让每个 call site 更清晰？如果不能，就保留重复。
> “提取后，每个 consumer 会更简单吗？还是需要理解一个更复杂的 generic interface？”

**7. 去重 business decision，允许重复 code**
DRY 适用于 business decision（validation rule、status mapping、calculation formula），而不是外观相似的代码。同一 business rule 出现在多处 → 提取为有名 constant 或 pure function。两段代码外观相似但表达不同 business intent → 保持分离。
> “这些代码块是否代表应该同时变更的同一 business decision？是 → 提取；否 → 保持分离。”

当原则 6 与 7 冲突时：**shared business invariant 以原则 7 为准**。Business decision 必须只存在于一处，即使 shared interface 因此略微复杂。其他情况以原则 6 为准。

**8. Flat over nested**
Component tree 和 code logic 都应优先保持 flat。过深的 nesting 是 complexity signal。
> “Nesting 是否已经让 flow 难以扫读？能否用 early return 或拆分来压平？”

**9. Composition over configuration**
优先让 consumer 组合小单元，而不是用大量 props 配置一个巨大 component。Composition 描述内部 architecture；面向 consumer 的 API 应保持 flat。当 composition 造成过深 nesting 时，使用 facade component。
> “是否有很多 props 在控制 layout 或 behavior variant？能否拆成可组合的小单元？”

### Readability 与 Intent

**10. Explicit over implicit**
Dependency 和 data flow 应该从代码表面就能看见，不要依赖 magic。
> “这行代码是否依赖 function signature 或 import list 中不可见的 runtime context、global state 或 module-level side effect？”

**11. Semantic variable，code as documentation**
使用有名 variable 表达 business intent，而不是 inline 复杂 expression。Variable name 回答“为什么”；expression 只回答“如何计算”。
> “在没有 context 的情况下，reader 能否看出这个 expression 的 business meaning？如果不能，就提取成有名 variable。”

### Purity

**12. 优先 pure function**
Pure component 和 pure function 更容易理解与测试。将 side effect 隔离并集中管理。
> “相同 input 是否总能得到相同 output？如果不能，能否把 side effect 推给 caller？”

## Unit 与 Feature Folder

一个 feature folder 约等于 bounded context，可以包含多个 **unit**（每个 unit = state machine / independent flow）。**应对每个 unit 运行 decision tree，而不是对整个 feature 运行**。如果多个 unit 只是共享 substrate，对整个 feature 判断会误升级为 complex page。

Cross-unit shared layer 中的每个共享项都应按自身 SRP 归属，不要强行放入 `domain/`。DDD 四层物理拆分只适用于 bounded context 内部且 complexity 确实值得时。大多数 feature 只需 small business component，不需要 `domain/` 目录。

### Boundary feature（没有 Screen，也没有 unit）

有些 feature 没有 Screen 和 unit：它们包裹 subtree，并承担 lifecycle responsibility（data prefetch、connection setup、identity sync）。Tier decision tree 不适用于此，因为它们没有 domain rule、orchestration flow 或可升级的 presentation layer。

应将它们视为独立类型，并回答三个问题：挂载在哪里、承担什么 suspense / error contract、向 descendant 暴露什么 context。

## Architecture Decision Tree

**核心原则：Complexity 决定 structure depth。** 不要对所有内容套用相同 architecture。Decision tree 用于指导 module-level structure；原则 6 仍然适用：如果全部 logic 能在一次阅读中清晰理解，就保持简单。

```
这个 unit 是否包含可独立于 component 测试的 business rule？
├─ 否 → 是否包含自完结的 operation flow（CRUD、modal flow）？
│   ├─ 否 → [Pure display] Component + utils
│   │   · Component 只负责 render
│   │   · Pure computation 放在 .utils 文件
│   │
│   └─ 是 → [Small business component] Component + hooks + utils
│       · UI shell 不包含 business logic，通过 props 接收全部内容
│       · 每个 operation flow 优先由一个聚焦的 hook 承担；只暴露该 flow 需要的 state 和 action
│       · Data transform 和 validation 是独立 pure function
│       · 从聚焦的 `*.rules.ts` / `*.model.ts` 文件开始；当多个 concern 或一个
│         足够复杂的 invariant 能因此获得更清晰的 boundary 时，再引入 `domain/`
│
└─ 是 → 是否需要 orchestrate 多个 data source，或有多个 consumer 共享 domain data？
    ├─ 否 → [Medium module] Component + hooks + domain/
    │   · domain：Domain model、business rule、domain data definition 和 shared carrier，且零 UI dependency
    │   · 按需添加内容，不要强制齐全所有类别（type、validator、context）
    │   · Component 可直接 import domain/ 中的 pure function，但 orchestration（API call、multi-step flow）必须经过 hook
    │
    └─ 是 → [Complex page] domain / application / presentation (/ infrastructure)
        · domain：Domain model、business rule、domain data definition 和 shared carrier，且零 UI dependency
        · application：Orchestrate domain + external service，并进行 data transform
        · presentation：只组合 Provider + component，不包含 business decision。Modal/drawer 的 visibility 和 stacking 属于这一层；是否触发 modal 则是 business rule，属于 application
        · infrastructure：External service adapter（如果项目有统一 query layer，可省略）
```

**Layered architecture 的硬性约束：**
- domain 绝不 import presentation 或 application
- application 绝不 import presentation
- presentation 绝不直接调用 API，也不包含 business rule
- Source-code dependency 向内指向：presentation → application → domain
- infrastructure 实现由 application 或 domain 拥有的 port，并向内依赖这些 contract

### Migration Signal

**Structure escalation：**
- **Pure display → Small business component**：Component 开始包含 API call、form submission 或 multi-step flow
- **Small business component → Medium module**：Hook 开始包含可独立于 component 测试的 business rule
- **Medium module → Complex page**：多个 component 需要共享 domain data，或第二个 data source 需要 orchestration
- **任意 tier → 更简单的 tier**：`domain/` 只有 type alias 而没有 business logic，或 application hook 只是简单 pass-through。重新运行 decision tree 并简化

前三种 migration 只需做 additive change（添加目录 + 移动文件）。Medium module 迁移到 complex page 时，可能需要拆分同时混合 orchestration 和 UI logic 的 hook，这是合理的 refactoring cost。

**State scope escalation：**
- **Component → Parent-child**：第二个 sibling 开始需要同一份 data
- **Parent-child → Scoped shared**：Props 开始穿过不使用它们的中间 component
- **Scoped shared → Global**：Data 开始跨 feature boundary 使用
- **Lifetime extension**：State 需要存活得比当前 scope 更久，例如在 page navigation 之后仍然保留

## Companion

React API-level pattern（Effects、Refs、Custom Hooks）应搭配 **react-best-practices** 使用。
