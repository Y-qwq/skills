---
name: frontend-architecture-guide
description: >
  Use when designing, refactoring, or reviewing React frontend structure: component and custom Hook
  boundaries, state ownership or Provider scope, abstractions, feature/module organization, layered
  architecture, or where state, logic, and files should live. Not for Effect dependencies, refs,
  memoization, or stale closures; use react-best-practices.
---

# Frontend Architecture Guide

一套帮助你写出 **Simple（真正简单）** 而不只是 **Easy（容易上手）** 的 Frontend 代码的决策框架。重点不是套用目录模板，而是判断何时拆分、拆到什么粒度，以及边界应该放在哪里。

## 核心原则

以下内容是判断依据，不是需要机械执行的硬性规则。应结合当前业务和代码上下文使用。

### 职责与边界

**1. 单一职责（Single Responsibility Principle）**

如果两个无关的业务需求都会导致同一个 component 或 Hook 被修改，就应该拆分。

> “产品修改功能 X 时，这个文件会变吗？修改功能 Y 时呢？如果两者都会，就拆分。”

**2. 使用方不需要阅读源码**

使用方应该只通过接口（props / 返回值）就能完整理解用法。

> “为了正确使用它，是否必须阅读源码？”

**3. 单个 prop 不应改变 component identity**

如果某个 prop 会导致完全不同的 render 分支，这实际上是多个 component 在伪装成一个。

> “移除这个 prop 后，剩余代码仍然说得通吗？如果不能，就拆分。”

**4. UI 与逻辑可分离**

替换 UI 组件库不应该要求重写业务逻辑。

> “逻辑代码是否 import 了 UI 组件库？如果是，它们已经耦合。”

### 数据流与 State

**5. State 放在真正需要它的位置**

State 应属于使用它的最小作用域。不要为了“以防万一”而提前向上提升。

> “删除这个 state 后，多少个 component 会受影响？只有一个，就保持在本地；多个 sibling component 需要，就放到它们最近的共同 ancestor。”

根据使用范围和生命周期选择 state 工具：

| State 范围 | 谁需要访问 | 如何传递 | 常见工具 |
|---|---|---|---|
| Component state | 当前 component | — | `useState` |
| Parent-child state | parent 与直接 child | 显式 props | 提升到 parent |
| Scoped shared state | subtree 内的任意层级 | 隐式订阅 | Context、scoped store 等项目约定 |
| Global state | 跨功能边界 | 隐式订阅 | 项目的全局状态方案 |

只有当 Provider boundary 在 component 树中清晰可见时，隐式订阅才是可接受的。

### 复杂度控制

**6. 结构抽象服务于清晰度，不是重复次数**

不要仅因为代码重复就提取 Hook、component 或文件。看到三次重复时，先问：抽象后的每个调用处是否更清晰？如果不是，就保留重复。

> “提取后，每个使用方会更容易理解吗？还是反而要先理解一个更复杂的通用接口？”

**7. 去重业务决策，允许重复代码**

DRY 适用于业务决策（校验规则、状态映射、计算公式），而不是外观相似的代码。同一业务规则出现在多处，就提取为有名常量或纯函数；两段代码外观相似但表达不同业务意图，则保持分离。

> “这些代码块是否表达应该同时变更的同一业务决策？是，就提取；否，就保持分离。”

当原则 6 与 7 冲突时，**共享业务不变量以原则 7 为准**。业务决策必须只存在于一处，即使共享接口因此略微复杂。其他情况以原则 6 为准。

**8. 优先扁平，避免过度嵌套（Flat over nested）**

Component 树和代码逻辑都应优先保持扁平。过深的嵌套是复杂度信号。

> “嵌套是否已经让流程难以扫读？能否通过 early return 或拆分来压平？”

**9. 组合优于配置（Composition over configuration）**

优先让使用方组合小单元，而不是用大量 props 配置一个巨大 component。Composition 用来表达内部结构；面向使用方的 API 仍应保持扁平。当 composition 造成过深嵌套时，可增加 facade component 封装。

> “是否有大量 props 在控制布局或行为变体？能否拆成可组合的小单元？”

### 可读性与意图

**10. 显式优于隐式（Explicit over implicit）**

依赖和数据流应该从代码表面就能看见，不要依赖隐藏的默认行为。

> “这行代码是否依赖 function signature 或 import list 中不可见的运行时上下文、global state 或 module-level 副作用？”

**11. 用语义化变量表达意图**

使用有名变量表达业务意图，而不是内联复杂表达式。变量名回答“为什么”，表达式只回答“如何计算”。

> “在没有上下文时，读者能否看出这个表达式的业务含义？如果不能，就提取为有名变量。”

### 纯度

**12. 优先纯函数（pure function）**

纯 component 和纯函数更容易理解与测试。应将副作用隔离并集中管理。

> “相同输入是否总能得到相同输出？如果不能，能否把副作用推给调用方？”

## Unit 与功能目录

一个功能目录（feature folder）大致对应一个 bounded context，其中可以包含多个 **unit**（每个 unit 对应一个 state machine 或独立流程）。**应对每个 unit 分别运行决策树，而不是对整个功能运行**。多个 unit 可能只是共享基础能力，若按整个功能判断，容易误升级为 Complex page。

跨 unit 共享的内容应按各自的 SRP 归属，不要强行放入 `domain/`。DDD 四层的物理拆分只适用于 bounded context 内部，并且复杂度确实值得时。大多数功能只需 Small business component，不需要 `domain/` 目录。

### 边界型功能（没有 Screen，也不构成 unit）

有些功能没有 Screen，也不构成 unit：它们只是包裹一棵 subtree，并承担某种生命周期职责，例如数据预取、连接初始化或身份同步。层级决策树不适用于它们，因为这里没有 domain 规则、编排流程或需要升级的 presentation 层。

应将它们视为独立类型，并回答三个问题：挂载在哪里、承担什么 Suspense / error contract、向 descendant 暴露什么 Context。

## 架构决策树

**核心原则：复杂度决定结构深度。** 不要对所有内容套用相同架构。决策树用于指导 module 级结构；原则 6 仍然适用：如果全部逻辑能在一次阅读中清晰理解，就保持简单。

```
这个 unit 是否包含能脱离 component 独立测试的业务规则？
├─ 否 → 是否包含自完结的操作流程（CRUD、modal flow）？
│   ├─ 否 → [Pure display] Component + utils
│   │   · Component 只负责 render
│   │   · 纯计算放在 `.utils` 文件
│   │
│   └─ 是 → [Small business component] Component + hooks + utils
│       · UI shell 不包含业务逻辑，通过 props 接收全部内容
│       · 每个操作流程优先由一个聚焦的 Hook 承担；只暴露该流程需要的 state 和 action
│       · 数据转换和校验是独立的纯函数
│       · 从聚焦的 `*.rules.ts` / `*.model.ts` 文件开始；当多个职责或一个
│         足够复杂的业务不变量因拆分而更清晰时，再引入 `domain/`
│
└─ 是 → 是否需要编排多个数据源，或有多个使用方共享 domain 数据？
    ├─ 否 → [Medium module] Component + hooks + domain/
    │   · domain：Domain model、业务规则、domain 数据定义和共享载体，且不依赖 UI
    │   · 按需添加内容，不要强制齐全所有类别（type、validator、Context）
    │   · Component 可直接 import `domain/` 中的纯函数，但编排（API 调用、多步流程）必须经过 Hook
    │
    └─ 是 → [Complex page] domain / application / presentation (/ infrastructure)
        · domain：Domain model、业务规则、domain 数据定义和共享载体，且不依赖 UI
        · application：编排 domain 与外部服务，并完成数据转换
        · presentation：只组合 Provider 与 component，不包含业务决策。Modal/drawer 的显示和层叠属于这一层；是否触发 modal 则是业务规则，属于 application
        · infrastructure：外部服务 adapter（如果项目有统一 query layer，可省略）
```

**分层架构的硬性约束：**

- domain 绝不 import presentation 或 application
- application 绝不 import presentation
- presentation 绝不直接调用 API，也不包含业务规则
- 源码依赖始终向内指向：presentation → application → domain
- infrastructure 实现由 application 或 domain 拥有的 port，并向内依赖这些 contract

### 结构迁移信号

**结构升级：**

- **Pure display → Small business component**：Component 开始包含 API 调用、form 提交或多步流程
- **Small business component → Medium module**：Hook 开始包含能脱离 component 独立测试的业务规则
- **Medium module → Complex page**：多个 component 需要共享 domain 数据，或第二个数据源需要编排
- **任意层级 → 更简单的层级**：`domain/` 只有 type alias 而没有业务逻辑，或 application Hook 只做透传。此时应重新运行决策树并简化

前三种迁移只需要增加目录并移动文件。Medium module 迁移到 Complex page 时，可能需要拆分同时混合编排和 UI 逻辑的 Hook，这是合理的重构成本。

**State 作用域升级：**

- **Component → Parent-child**：第二个 sibling component 开始需要同一份数据
- **Parent-child → Scoped shared**：Props 开始穿过不使用它们的中间 component
- **Scoped shared → Global**：数据开始跨功能边界使用
- **Lifetime extension**：State 需要存活得比当前作用域更久，例如在页面切换后仍然保留

## 配套 Skill

涉及 React API 层面的模式（Effects、Refs、Custom Hooks）时，应搭配 **react-best-practices** 使用。
