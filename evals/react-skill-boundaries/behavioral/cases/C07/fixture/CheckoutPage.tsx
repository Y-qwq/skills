import { Checkout } from "./domain";
import { loadCheckout } from "./application";

export async function CheckoutPage({ orderId }: { orderId: string }) {
  const checkout = await loadCheckout(orderId);
  return <div>Total: {(checkout as Checkout).total}</div>;
}
