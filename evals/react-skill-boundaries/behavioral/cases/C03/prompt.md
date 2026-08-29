# Shared search filters ownership

我们把 appointment search 和 customer search 的 filters 放进了一个 Zustand store，因为两个 feature 使用相同的 date range、location 和 keyword 语法。请 review 这个 state owner 是否合理。

产品约束如下：

- 用户要能复制当前搜索链接给同事，对方打开后看到相同 filters。
- 浏览器 Back / Forward 应恢复每一页当时的 filters。
- 刷新页面后 filters 仍应存在。
- 两个页面不要求实时同步；用户在 customer search 改 keyword，不应悄悄改变 appointment search 的历史记录。
- 两个 feature 可以共享 parsing、validation 和 serialization 规则。

请给出建议的数据流与代码归属，说明跨 feature 这一事实在判断中意味着什么。
