# Current route composition

```tsx
export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppShell() {
  const now = useClock();

  return (
    <Frame clock={<Clock value={now} />}>
      <CartProvider>
        <Router>
          <Route path="/shop/*" element={<ShopRoutes />} />
          <Route path="/settings/*" element={<SettingsRoutes />} />
          <Route path="/staff/*" element={<StaffRoutes />} />
          <Route path="/reports/*" element={<ReportRoutes />} />
        </Router>
      </CartProvider>
    </Frame>
  );
}
```

`useClock` updates once per second, so `AppShell` and the current `CartProvider` rerender once per second. `ShopRoutes` has a stable route layout that remains mounted while navigating among product, cart, and checkout pages, then unmounts when navigation leaves `/shop`.
