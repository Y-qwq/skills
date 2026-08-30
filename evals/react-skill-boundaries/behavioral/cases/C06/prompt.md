# Cancellation flow structure review

请 review cancellation 页面当前的结构，并判断是否需要更明确的 application/domain 边界。

业务约束：取消报价只对同一个 reservation version 和 policy revision 有效；reservation 更新后旧 quote 必须失效并重新计算；Confirm 必须提交页面实际确认过的两个 version；任一来源失败时不能提交，Retry 需要重新建立一组一致的数据。以后页面和客服侧边栏都会复用这套 cancellation flow。

请说明真正需要共同拥有的 invariant、生命周期和 API contract，不要求套固定目录模板。
