# Request

团队在讨论是否应该全面禁止 `useMount`。请 review fixture 中的两处使用，判断它们应该一起保留、一起替换，还是分别处理，并给出必要的代码修改。

项目事实：

- 开发环境启用 Strict Mode。
- `appLifecycle` 是进程级 singleton；`AppLifecycleObserver` 每次挂载订阅一次、卸载时取消，就是它的完整 contract。
- `RoomSession` 在保持挂载的情况下会收到新的 `roomId` 或 `serverUrl`，连接应随这两个输入重新同步。
- `createRoomConnection` 每次返回独立连接，`disconnect()` 与 `connect()` 对称。

重点解释 `once per mount` 在这里分别意味着什么，不要扩展到文件归属或 Hook API 重设计。
