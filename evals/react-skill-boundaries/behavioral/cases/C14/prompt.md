# Request

购物车现在有两个问题：离开 `/shop` 去设置页，再回到 `/shop` 时，上一次临时购物车仍然存在；另外 app shell 的时钟每秒更新时，Profiler 显示只读取购物车的 consumer 也会 rerender，即使 `lines` 没变。

请 review fixture 并给出一个保持 `CartContextValue` public shape 的调整方案。需要同时说明 state 应该由哪个 scope 持有，以及无关 parent render 为什么会传播给 consumer。

业务 contract：

- 商品页、购物车页和 checkout 页都在 `/shop/*` 下，它们在该 route subtree 内共享同一份 cart。
- 离开 `/shop` 代表结束这次临时购物流程；再次进入应得到空 cart。
- 设置、员工和报表 feature 不读写 cart。
- 这个 package 未启用 React Compiler。
- Profiler 已确认 `lines` 不变时的传播来自 Provider `value` identity。
