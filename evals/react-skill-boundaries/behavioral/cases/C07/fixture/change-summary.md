# Added files

```ts
// domain/index.ts
export type Checkout = ApiCheckoutResponse;

// application/index.ts
export async function loadCheckout(orderId: string) {
  return api.checkout.get(orderId);
}

// presentation/index.ts
export { CheckoutPage } from "../CheckoutPage";
```

Before the PR, the same type alias, API call, and component were colocated in `CheckoutPage.tsx`. There is one consumer and no independent business rule.
