# Invoice editor Hook contract review

请完整 review `InvoiceEditor` 的 component、state 和 custom Hook 边界。另一个 compact editor 准备复用相同的编辑规则，但不复用当前 UI。

业务规则包括：已有 line item 后不能切 currency；discount 不能超过 subtotal；保存只能提交通过这些规则的 draft。现在这些判断部分在页面按钮里，compact editor 已经开始复制。

代码没有订阅、异步 Effect、ref、imperative handle 或 renderer integration 问题。请重点判断 state/action owner、Hook 的公开 API 和纯业务规则应放在哪里。
