# Request

员工在同一个 app shell 内切换 business 后，通知铃铛仍会收到上一个 business 的事件；多次进出通知页面后，一条事件还会更新多次。请 review `fixture/Notifications.tsx`，修复订阅生命周期，并判断这个 Hook 应该放在哪个 feature/module。

项目事实：

- 当前 `useNotificationInbox` 位于 `src/shared/hooks/useNotificationInbox.ts`。
- 唯一 consumer 是 `src/features/notifications/NotificationBell.tsx`；没有其他 feature 使用它。
- unread 语义、`notificationClient` adapter 和相应测试都由 notifications feature 维护。
- 切换 business 时 `NotificationBell` 保持挂载，但会收到新的 `businessId`。
- `notificationClient.subscribe(businessId, listener)` 会先同步给 listener 当前 unread snapshot，随后推送更新，并返回带 `unsubscribe()` 的 subscription。
- 开发环境启用 Strict Mode。

请给出最小代码调整、合理的目标位置和验证重点；不要引入新的全局 store 或 Provider。
