# Checkout structure refactor review

请 review 这个“架构升级”PR。作者认为 checkout 已经重要到需要完整分层，所以把原文件移动到 `domain/`、`application/`、`presentation/`。

PR 没有改变公开 API、state owner、依赖方向、生命周期、错误恢复或测试边界；现有测试也只是更新 import path。后续需求目前只有一个：在同一个页面多展示 loyalty points。

请判断这次升级是否形成了有价值的责任边界，以及应该合并、调整还是简化。
