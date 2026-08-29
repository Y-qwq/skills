# Request

我们有一个 React Native 登录态组件。开发环境里切一次前后台，`refreshSession` 偶尔会执行两三次；生产环境中登出再登录几次后，重复次数也会增加。

请 review `fixture/SessionGate.tsx`，说明根因并给出最小修改。不要改变 `SessionGate` 的公开 props，也不要把逻辑移到新的全局 store。

项目事实：

- React Native 0.74，开发环境启用 Strict Mode。
- 登录/登出会卸载再挂载 `SessionGate`。
- `refreshSession` 由调用方保持稳定。
- 当前版本的 `AppState.addEventListener` 返回一个 `NativeEventSubscription`，其 `remove()` 会注销该次订阅。

请同时说明你会怎样验证修复。
