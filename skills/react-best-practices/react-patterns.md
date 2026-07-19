# React Patterns Reference

本文件提供 `SKILL.md` 中各项模式的代码示例。只有需要查看或编写具体实现时才加载。

## Contents

- [Renderer labels](#renderer-labels)
- [Effect anti-patterns](#shared-effect-anti-patterns)
- [Effect dependencies](#shared-effect-dependencies)
- [Effect cleanup and fetching](#effect-cleanup-and-fetching)
- [Ref patterns](#ref-patterns)
- [Custom Hook patterns](#shared-custom-hook-patterns)
- [Component patterns](#component-patterns)

## Renderer Labels

- **Shared**：与 renderer 无关，适用于 React 的通用模式。
- **React DOM**：使用 browser global、DOM host element 或 `react-dom` API。
- **React Native**：使用 native host component 或 React Native 事件 API。

为了让示例足够具体，Shared 原则可能会使用某个 renderer 的 host element。应用到其他 renderer 时，应迁移原则，而不是照搬 host API。

## [Shared] Effect Anti-Patterns

### Derived State（在 render 阶段计算）

```tsx
// BAD: Effect for derived state
const [firstName, setFirstName] = useState('Taylor');
const [lastName, setLastName] = useState('Swift');
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// GOOD: Calculate during render
const [firstName, setFirstName] = useState('Taylor');
const [lastName, setLastName] = useState('Swift');
const fullName = firstName + ' ' + lastName;
```

### 昂贵计算（遵循 React Compiler 策略）

```tsx
// BAD: Effect for caching
const [visibleTodos, setVisibleTodos] = useState([]);
useEffect(() => {
  setVisibleTodos(getFilteredTodos(todos, filter));
}, [todos, filter]);

// GOOD when React Compiler covers this component or Hook:
// write the direct calculation and let the compiler optimize it.
const visibleTodos = getFilteredTodos(todos, filter);
```

```tsx
// GOOD without compiler coverage, or as a justified escape hatch:
// useMemo is a performance optimization, not a correctness requirement.
const visibleTodos = useMemo(
  () => getFilteredTodos(todos, filter),
  [todos, filter]
);
```

### props 变化时重置 State（使用 `key`）

```tsx
// BAD: Effect to reset state
function ProfilePage({ userId }) {
  const [comment, setComment] = useState('');
  useEffect(() => {
    setComment('');
  }, [userId]);
}

// GOOD: Use key to reset component state
function ProfilePage({ userId }) {
  return <Profile userId={userId} key={userId} />;
}

function Profile({ userId }) {
  const [comment, setComment] = useState(''); // Resets automatically when key changes
}
```

### 用户事件处理（使用 event handler）

```tsx
// BAD: Event-specific logic in Effect
function ProductPage({ product, addToCart }) {
  useEffect(() => {
    if (product.isInCart) {
      showNotification(`Added ${product.name} to cart`);
    }
  }, [product]);
}

// GOOD: Logic in event handler
function ProductPage({ product, addToCart }) {
  function buyProduct() {
    addToCart(product);
    showNotification(`Added ${product.name} to cart`);
  }
}
```

### 通知 parent state 变化

```tsx
// BAD: Effect to notify parent
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false);
  useEffect(() => {
    onChange(isOn);
  }, [isOn, onChange]);
}

// GOOD: Update both in event handler
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false);
  function updateToggle(nextIsOn) {
    setIsOn(nextIsOn);
    onChange(nextIsOn);
  }
}

// BEST: Fully controlled component
function Toggle({ isOn, onChange }) {
  function handleClick() {
    onChange(!isOn);
  }
}
```

### Effect 链

```tsx
// BAD: Effect chain — each effect re-renders before the next fires
useEffect(() => {
  if (card !== null && card.gold) {
    setGoldCardCount(c => c + 1);
  }
}, [card]);

useEffect(() => {
  if (goldCardCount > 3) {
    setRound(r => r + 1);
    setGoldCardCount(0);
  }
}, [goldCardCount]);

// GOOD: Calculate derived state, update everything in one event handler
const isGameOver = round > 5;

function handlePlaceCard(nextCard) {
  setCard(nextCard);
  if (nextCard.gold) {
    if (goldCardCount < 3) {
      setGoldCardCount(goldCardCount + 1);
    } else {
      setGoldCardCount(0);
      setRound(round + 1);
    }
  }
}
```

## [Shared] Effect Dependencies

### 修正依赖后再考虑 suppression

优先重构 Effect，让 dependency list 准确反映真实依赖。Suppression 只能作为例外，并且必须记录为什么外部 identity 约束无法通过其他方式安全表达。

```tsx
// BAD: Suppressing linter hides bugs
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + increment);
  }, 1000);
  return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// GOOD: Fix the code, not the linter
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + increment);
  }, 1000);
  return () => clearInterval(id);
}, [increment]);
```

### [Shared, React DOM 示例] 使用 updater function 移除 state 依赖

```tsx
// BAD: messages in dependencies causes reconnection on every message
useEffect(() => {
  function handleMessage(event) {
    setMessages([...messages, event.data]);
  }
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [messages]); // Reconnects on every message!

// GOOD: Updater function removes the dependency
useEffect(() => {
  function handleMessage(event) {
    setMessages(messages => [...messages, event.data]);
  }
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []); // No messages dependency needed
```

### 将 object/function 移入 Effect

```tsx
// BAD: Object created each render triggers Effect
function ChatRoom({ roomId, serverUrl }) {
  const options = { serverUrl, roomId }; // New object each render
  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // Reconnects every render!
}

// GOOD: Create object inside Effect
function ChatRoom({ roomId, serverUrl }) {
  useEffect(() => {
    const options = { serverUrl, roomId };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // Only reconnects when values change
}
```

### 使用 `useEffectEvent` 处理 non-reactive 逻辑

Effect Event 不是通用的 stable callback。它只用于由 Effect 触发的 non-reactive 逻辑；只能从 Effect 或其他 Effect Event 调用，不能传给其他 component 或 Hook，也不应加入 dependency array。

```tsx
// BAD: theme change reconnects chat
function ChatRoom({ roomId, serverUrl, theme }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      showNotification('Connected!', theme);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl, theme]); // Reconnects on theme change!
}

// GOOD: useEffectEvent for non-reactive logic
function ChatRoom({ roomId, serverUrl, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      onConnected();
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // theme no longer causes reconnection
}
```

### 使用 `useEffectEvent` 包装 callback prop

```tsx
// BAD: Callback prop in dependencies reconnects if parent re-renders
function ChatRoom({ roomId, serverUrl, onReceiveMessage }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('message', onReceiveMessage);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl, onReceiveMessage]);
}

// GOOD: Wrap callback in useEffectEvent
function ChatRoom({ roomId, serverUrl, onReceiveMessage }) {
  const onMessage = useEffectEvent(onReceiveMessage);

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('message', onMessage);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // Effect Events are intentionally omitted
}
```

## Effect Cleanup and Fetching

### [Shared] 始终清理订阅

```tsx
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();
  return () => connection.disconnect(); // REQUIRED
}, [roomId, serverUrl]);
```

### [React DOM] Browser 事件订阅

```tsx
useEffect(() => {
  function handleScroll() {
    console.log(window.scrollY);
  }
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll); // REQUIRED
}, []);
```

### [React Native] Native 事件订阅

React Native 事件 API 通常返回一个带 `remove` 方法的 subscription 对象。应根据项目实际安装的 React Native 版本确认 API contract。

```tsx
import { AppState } from 'react-native';

function AppStateStatus() {
  const [currentAppState, setCurrentAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setCurrentAppState(nextAppState);
    });

    return () => subscription.remove();
  }, []);

  return currentAppState;
}
```

### 使用 ignore flag 请求数据

项目已有 framework loader、query library 或 client cache 时应优先复用。下面的手动 Effect 只演示如何防止过期响应覆盖新结果；它本身不提供缓存、请求去重、重试或防止请求瀑布。

请求 API 支持取消时使用 `AbortController`。底层操作无法取消时，ignore flag 仍可避免过期响应更新 state。

```tsx
useEffect(() => {
  let ignore = false;

  async function fetchData() {
    const result = await fetchTodos(userId);
    if (!ignore) {
      setTodos(result);
    }
  }

  fetchData();

  return () => {
    ignore = true; // Prevents stale data from superseded requests
  };
}, [userId]);
```

### 开发环境重复执行是预期行为

Strict Mode 会在第一次真实 Effect setup 前，额外执行一轮仅限开发环境的 setup-cleanup cycle。应把它视为压力测试：让 cleanup 和 setup 对称，而不是屏蔽额外执行。

```tsx
// BAD: Hiding the symptom
const didInit = useRef(false);
useEffect(() => {
  if (didInit.current) return;
  didInit.current = true;
  // ...
}, []);

// GOOD: Fix the cleanup so remounting is safe
useEffect(() => {
  const connection = createConnection();
  connection.connect();
  return () => connection.disconnect();
}, []);
```

## Ref Patterns

### [Shared] Ref 保存不影响 render 的值

```tsx
// GOOD: Ref for timeout ID (doesn't affect UI)
const timeoutRef = useRef(null);

function handleClick() {
  clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => {
    // ...
  }, 1000);
}

// BAD: Using ref for displayed value — UI won't update
function Counter() {
  const countRef = useRef(0);

  function handleIncrement() {
    countRef.current++;
  }

  return <CounterView count={countRef.current} onIncrement={handleIncrement} />;
}
```

### [Shared] 避免在 render 期间读写 `ref.current`

```tsx
// BAD: Reading/writing ref during render
function MyComponent() {
  const ref = useRef(0);
  ref.current++; // Mutating during render!
  return ref.current; // Reading during render!
}

// GOOD: Read/write refs in event handlers and effects
function MyComponent() {
  const ref = useRef(0);

  function handleClick() {
    ref.current++; // OK in event handler
  }

  useEffect(() => {
    ref.current = someValue; // OK in effect
  }, [someValue]);

  return null;
}

// ALLOWED: predictable one-time initialization.
// createCache() must return the same kind of stable local object for this component.
function CachedComponent() {
  const cacheRef = useRef(null);
  if (cacheRef.current === null) {
    cacheRef.current = createCache();
  }

  // Use the initialized object from event handlers or Effects.
  // Rendering must not depend on later mutations to cacheRef.current.
  return null;
}
```

### [Shared, React DOM 示例] 动态列表的 ref callback

```tsx
// BAD: Can't call useRef in a loop
{items.map((item) => {
  const ref = useRef(null); // Rules of Hooks violation!
  return <li ref={ref} />;
})}

// GOOD: Ref callback with Map
const itemsRef = useRef(new Map());

{items.map((item) => (
  <li
    key={item.id}
    ref={(node) => {
      if (node) {
        itemsRef.current.set(item.id, node);
      } else {
        itemsRef.current.delete(item.id);
      }
    }}
  />
))}
```

### [React 19+, React DOM] 使用 `useImperativeHandle` 限制暴露范围

下面的 ref-as-prop 写法需要 React 19。React 18 及更早版本应使用 `forwardRef` 接收 `ref`。

```tsx
// Limit what parent can access through a ref — expose only the API surface you intend
function MyInput({ ref }) {
  const realInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus() {
      realInputRef.current?.focus();
    },
    // Parent can ONLY call focus(), not access the full DOM node
  }));

  return <input ref={realInputRef} />;
}
```

### [React Native] 命令式 host method

```tsx
import { Button, TextInput } from 'react-native';

function SearchField() {
  const inputRef = useRef<TextInput>(null);

  return (
    <>
      <TextInput ref={inputRef} />
      <Button title="Focus search" onPress={() => inputRef.current?.focus()} />
    </>
  );
}
```

## [Shared] Custom Hook Patterns

### Hook 共享逻辑，而不是 state

```tsx
// Each call gets independent state — these are two separate online status subscriptions
function StatusBar() {
  const isOnline = useOnlineStatus();
}

function SaveButton() {
  const isOnline = useOnlineStatus();
}
```

### 只有调用 Hook 的函数才命名为 `useXxx`

```tsx
// BAD: useXxx prefix but doesn't call any hooks
function useSorted(items) {
  return items.slice().sort();
}

// GOOD: Regular function
function getSorted(items) {
  return items.slice().sort();
}

// GOOD: Uses hooks, so prefix with use
function useAuth() {
  return useContext(AuthContext);
}
```

### Lifecycle Hook 应表达真实语义

`useMount`、`useEffectOnce` 可以减少重复模板代码，适用于“once per mount”本身就是明确约定的场景。风险不在封装本身，而在于它是否隐藏了应该触发重新同步的 reactive dependency，或遗漏 cleanup。它们仍应遵守 Strict Mode 的额外 setup-cleanup cycle，不保证开发环境只执行一次。

```tsx
// GOOD: once-per-mount is the actual contract, and cleanup is preserved
useMount(() => {
  const subscription = lifecycle.subscribe(handleLifecycleChange);
  return () => subscription.remove();
});

// BAD: roomId and serverUrl are reactive, but useMount hides that fact
useMount(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();
  return () => connection.disconnect();
});

// GOOD: use an Effect when those values should re-synchronize the connection
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId, serverUrl]);
```

## Component Patterns

### [Shared, React DOM 示例] Controlled 与 Uncontrolled

```tsx
// Uncontrolled: component owns state
function SearchInput() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}

// Controlled: parent owns state — more composable, easier to test
function SearchInput({ query, onQueryChange }) {
  return <input value={query} onChange={e => onQueryChange(e.target.value)} />;
}
```

### [Shared] 优先 composition，避免 prop drilling

```tsx
// BAD: Prop drilling through intermediate components that don't use the value
<App user={user}>
  <Layout user={user}>
    <Header user={user}>
      <Avatar user={user} />
    </Header>
  </Layout>
</App>

// GOOD: Pass the rendered element, not raw data
<App>
  <Layout>
    <Header avatar={<Avatar user={user} />} />
  </Layout>
</App>

// GOOD: Context for a visible scoped subtree or truly global state
<UserContext.Provider value={user}>
  <App />
</UserContext.Provider>
```

### [React DOM] 使用 `flushSync` 同步更新 DOM

```tsx
// Use sparingly when an integration must observe the updated DOM synchronously
// (e.g., scroll to a newly added list item before the next paint)
import { flushSync } from 'react-dom';

function handleAdd() {
  flushSync(() => {
    setTodos([...todos, newTodo]);
  });
  // DOM is now updated synchronously — safe to read layout
  listRef.current.lastChild.scrollIntoView();
}
```
