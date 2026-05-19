"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type CartItem =
  | {
      kind: "gift";
      giftName: string;
      price: number;
      quantity: number;
      imageUrl: string;
      description: string;
      /** null = sem limite */
      availableQuantity: number | null;
    }
  | {
      kind: "donation";
      id: string;
      amount: number;
    };

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addGift: (gift: {
    giftName: string;
    price: number;
    imageUrl: string;
    description: string;
    availableQuantity: number | null;
  }) => void;
  addDonation: (amount: number) => void;
  setGiftQuantity: (giftName: string, quantity: number) => void;
  removeGift: (giftName: string) => void;
  removeDonation: (id: string) => void;
  clear: () => void;
  giftQuantityInCart: (giftName: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "fp-cart-v1";

function loadInitial(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is CartItem =>
        it &&
        typeof it === "object" &&
        (it.kind === "gift" || it.kind === "donation")
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const addGift = useCallback(
    (gift: {
      giftName: string;
      price: number;
      imageUrl: string;
      description: string;
      availableQuantity: number | null;
    }) => {
      setItems((prev) => {
        const existing = prev.find(
          (it) => it.kind === "gift" && it.giftName === gift.giftName
        );
        if (existing && existing.kind === "gift") {
          const limit = gift.availableQuantity;
          if (limit !== null && existing.quantity >= limit) {
            return prev;
          }
          return prev.map((it) =>
            it.kind === "gift" && it.giftName === gift.giftName
              ? {
                  ...it,
                  quantity: it.quantity + 1,
                  availableQuantity: gift.availableQuantity,
                  // refresh stale fields too
                  price: gift.price,
                  imageUrl: gift.imageUrl,
                  description: gift.description,
                }
              : it
          );
        }
        return [
          ...prev,
          {
            kind: "gift",
            giftName: gift.giftName,
            price: gift.price,
            quantity: 1,
            imageUrl: gift.imageUrl,
            description: gift.description,
            availableQuantity: gift.availableQuantity,
          },
        ];
      });
    },
    []
  );

  const addDonation = useCallback((amount: number) => {
    if (amount < 1) return;
    setItems((prev) => [
      ...prev,
      {
        kind: "donation",
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `don-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        amount,
      },
    ]);
  }, []);

  const setGiftQuantity = useCallback((giftName: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter(
          (it) => !(it.kind === "gift" && it.giftName === giftName)
        );
      }
      return prev.map((it) => {
        if (!(it.kind === "gift" && it.giftName === giftName)) return it;
        const limit = it.availableQuantity;
        const clamped =
          limit !== null ? Math.min(quantity, limit) : quantity;
        return { ...it, quantity: clamped };
      });
    });
  }, []);

  const removeGift = useCallback((giftName: string) => {
    setItems((prev) =>
      prev.filter((it) => !(it.kind === "gift" && it.giftName === giftName))
    );
  }, []);

  const removeDonation = useCallback((id: string) => {
    setItems((prev) =>
      prev.filter((it) => !(it.kind === "donation" && it.id === id))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const giftQuantityInCart = useCallback(
    (giftName: string) => {
      const it = items.find(
        (i) => i.kind === "gift" && i.giftName === giftName
      );
      return it && it.kind === "gift" ? it.quantity : 0;
    },
    [items]
  );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, it) =>
          sum + (it.kind === "gift" ? it.price * it.quantity : it.amount),
        0
      ),
    [items]
  );

  const itemCount = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (it.kind === "gift" ? it.quantity : 1),
        0
      ),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      total,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addGift,
      addDonation,
      setGiftQuantity,
      removeGift,
      removeDonation,
      clear,
      giftQuantityInCart,
    }),
    [
      items,
      itemCount,
      total,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addGift,
      addDonation,
      setGiftQuantity,
      removeGift,
      removeDonation,
      clear,
      giftQuantityInCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
