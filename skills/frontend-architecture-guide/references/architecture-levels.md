# Architecture Levels Reference

仅在任务涉及 module 层级选择、分层或结构升级时读取。本文件帮助判断当前复杂度需要多深的结构；它不是目录模板。

## 先确定判断单元

一个 feature folder 可能包含多个 **unit**。每个 unit 对应一个独立流程、state machine 或稳定业务职责，应分别运行决策树。若把整个 feature 当成单一 unit，共享基础能力和互不相关的查询容易造成不必要的层级升级。

有些边界型功能没有 Screen，也不构成 unit，只负责包裹 subtree 并承担数据预取、连接初始化或身份同步等生命周期职责。不要对它套用下列层级；直接确认挂载位置、Suspense/error contract，以及向 descendant 暴露的接口。

## 决策树

核心原则：复杂度决定结构深度。只要当前逻辑能够在一次阅读中清晰理解，就保持简单。

```text
这个 unit 是否包含能脱离 component 独立测试的业务规则？
├─ 否 → 是否包含自完结的操作流程（例如 CRUD、form 或 modal flow）？
│   ├─ 否 → Pure display
│   └─ 是 → Small business component
└─ 是 → 是否满足任一条件？
        A. 多个使用方需要共享 domain 数据或 application coordination
        B. 多个数据源需要共同编排，并共享业务不变量、生命周期、错误恢复或一致性要求
    ├─ 否 → Medium module
    └─ 是 → Complex page
```

多个互不依赖的查询本身不是升级为 Complex page 的理由。先判断它们是否只是并列展示；只有共同编排形成稳定的一致性或恢复 contract 时，才增加 application 层级。

## Pure Display

适用于只负责 render、没有自完结操作流程或独立业务规则的 unit。

- Component 接收完整展示 contract。
- 小型纯计算可留在同文件；拆出 utils 只在命名或复用确实改善理解时进行。
- 不预建 hooks、domain 或 application 目录。

## Small Business Component

适用于包含自完结操作流程，但业务规则仍能在 component、聚焦 Hook 和少量纯函数间清晰表达的 unit。

- UI shell 通过明确 props 接收数据和 action。
- Hook 可以承载一个聚焦流程，只暴露该流程需要的 state/action。
- 校验和数据转换优先使用纯函数。
- 从聚焦的 `*.rules.ts` 或 `*.model.ts` 开始；只有形成清晰责任边界时再引入目录。

## Medium Module

适用于存在可独立测试的业务规则，但尚不需要跨使用方或多数据源的一致编排。

- `domain` 保存 domain model、业务不变量和纯规则，不依赖 UI。
- Component 可以调用 domain 纯函数；API 调用或多步编排由明确的 application owner 或 Hook 承担。
- 只添加当前需要的文件，不要求 type、validator、Context 等类别齐全。

## Complex Page

适用于多个使用方共享 domain/application coordination，或多个数据源必须在同一业务不变量、生命周期、错误恢复或一致性 contract 下共同编排。

- `domain`：domain model、业务规则和内部 contract，不依赖 UI 或 application 实现。
- `application`：编排 domain 与外部服务，管理一致性、恢复和数据转换。
- `presentation`：组合 Provider 与 component，不拥有业务决策或 API 编排。
- `infrastructure`：外部服务 adapter；项目已有统一 data/query layer 时可以省略。

依赖方向应体现 ownership：presentation → application → domain。Infrastructure 实现由内部层拥有的 port，并依赖该 contract；不要让 domain 或 application 反向依赖 presentation。

## 结构迁移信号

以下是重新运行决策树的信号，不是自动升级规则：

- **Pure display → Small business component**：开始拥有 form 提交、CRUD 或 modal 等自完结流程。
- **Small business component → Medium module**：出现需要脱离 component 独立测试和集中维护的业务不变量。
- **Medium module → Complex page**：多个使用方需要共享 domain/application coordination；或多个数据源形成共同的生命周期、一致性、错误恢复或业务不变量。
- **任意层级 → 更简单层级**：`domain` 只有 type alias、application 只做透传，或层级没有形成实际 contract。

结构升级可能需要调整 ownership、公开 API、依赖方向、生命周期和测试边界。若升级只增加目录并移动文件，却没有形成更清晰的责任边界，应重新确认升级是否有价值。

## State Scope 迁移信号

- 第二个 consumer 需要同一状态转换时，重新检查最近的共同 owner；不要只因 consumer 数量机械提升。
- Props 穿过不拥有也不使用数据的中间层时，比较 composition、明确的 feature owner 与 scoped Provider。
- 跨 feature 使用时，重新检查 source of truth、写入方、生命周期与恢复方式；在 URL、server cache、feature owner、scoped Provider 和 global store 之间选择。
- 只有具备应用级身份和生命周期，并由应用级 owner 维护的数据才进入 global store。
- State 需要跨页面或卸载继续存在时，先确认恢复来源；可恢复的 server/URL state 不应仅为延长内存生命周期而复制进 global store。
