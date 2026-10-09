---
name: frontend-architecture-guide
description: >
  Design and review React component/Hook boundaries, state ownership and Provider scope,
  public contracts, abstractions, and cross-module dependencies. Use when deciding whether
  to split, combine, share, or relocate responsibilities. Not for ordinary styling or local
  display edits, or React runtime issues such as Effect dependencies and stale closures.
---

# Frontend Architecture Guide

帮助判断职责如何拆分、组合与归属。文件命名、目录和技术选型遵循项目 AGENTS 与现有规范；只有实际责任边界需要时才增加结构。

围绕本次任务涉及的边界及其直接调用方判断，不自动扩大为整个 feature 的重构。Effect、cleanup、ref、memoization 等运行时问题由 `react-best-practices` 处理；同时存在独立的结构与运行时问题时才共用两个 skill。

## 为什么要拆

从独立变化的需求和业务不变量判断边界：哪些职责会相互干扰，哪些决策必须一起变化？同一业务规则散落在多个调用方时，应集中到明确 owner；外观相似但业务意图不同的代码可以保留重复。

文件长度、分支数量和重复次数只提供线索。大块 render branch 只有在体现不同职责、生命周期或使用方 contract 时才值得拆分。按独立流程或稳定职责判断，不把整个 feature 的复杂度归给每个单元。

## 谁拥有它

State 与 action 属于能够维护不变量的最小稳定 owner。一起检查来源、允许的写入方、冲突处理、所需生命周期、重置与恢复方式，以及哪些 consumer 必须共享同一次状态转换。

区分远端事实、用户草稿与临时 UI state；派生值优先从其来源计算。跨页面或跨 feature 使用不自动需要全局 store；可从 server cache 或 URL 恢复的数据，不应仅为延长内存生命周期而再复制一份。Controlled/uncontrolled API 和 Provider 位置由这些约束决定。

## 边界是否清楚

调用方应能从输入、结果、动作及失败语义理解 contract。Owner 对外暴露维护其不变量的能力，避免让每个调用方依靠通用 setter 或 raw dispatch 重新实现同一业务决策。

拆分应减少需要同时理解的上下文，并支持职责独立变化。多个数据源需要共同维护一致性或恢复语义时，由明确的流程 owner 协调；独立展示的数据可以保留各自的加载、错误与刷新边界。

## 依赖是否合理

UI 可以消费业务 contract；独立业务规则应能脱离具体 UI 使用。纯展示组件接收明确的数据和动作，Screen 或流程容器可以直接承担清楚、聚焦的编排。只有提取后形成真实责任边界时才增加 Hook、controller 或 adapter。

检查实际依赖和决策归属，不根据目录名称推断分层。查询、外部服务和持久化沿用项目已有边界；不要求为了抽象完整而增加 domain/application/presentation/infrastructure 层。

## 抽象是否值得

抽象应集中需要一起变化的决策，并简化调用处。若只是搬移代码、增加透传、让依赖变隐式，或为未知消费者引入配置与 callback 协议，优先保持直接表达。Composition 与共享 Provider 也按这个标准选择。

已有抽象失去独立职责时，可以合并或删除。短 façade 若拥有默认策略、适配或稳定公开接口，仍可能有价值；不按行数判断。Config 本身是需要存储、传输或编辑的业务数据时可以保留，普通 UI 组合无需发展成配置框架。

## 判断示例

- 页面并列展示两个独立 Query：可由页面直接组合；共享版本一致性、确认与恢复的两个结果，则需要共同流程 owner。Query 数量本身不决定结构。
- 两个页面共享购物车草稿：按购物流程的生命周期选择稳定 owner；跨页面不意味着应用级全局状态。
- 一个短组件绑定项目上传策略：有实际 contract 就可保留；只改名转发且没有独立责任的包装可以收回。

给出建议时说明当前边界的问题和调整后的收益。当前结构已足够清楚时，保留现状也是完整结论。
