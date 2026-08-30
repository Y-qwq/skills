import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

interface CartLine {
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

interface Product {
  id: string;
  priceCents: number;
}

export interface CartContextValue {
  lines: CartLine[];
  totalCents: number;
  addLine: (product: Product) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addLine = (product: Product) => {
    setLines([
      ...lines,
      { productId: product.id, quantity: 1, unitPriceCents: product.priceCents },
    ]);
  };

  const totalCents = lines.reduce(
    (total, line) => total + line.quantity * line.unitPriceCents,
    0,
  );

  return (
    <CartContext.Provider value={{ lines, totalCents, addLine }}>
      {children}
    </CartContext.Provider>
  );
}
