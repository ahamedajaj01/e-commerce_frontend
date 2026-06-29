"use client";

import { createContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchCart, addToCart, updateCartItem, removeFromCart } from "@/lib/api/cart";
import type { Cart, CartItem } from "@/types/cart";
import { ApiError } from "@/lib/api/client";

interface CartContextValue {
  cart: Cart | null;
  items: CartItem[];
  totalItems: number;
  totalPrice: string;
  isGuest: boolean;
  isLoading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, qty?: number, mediaId?: string) => Promise<void>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearCart: () => void;
}

const defaultValue: CartContextValue = {
  cart: null,
  items: [],
  totalItems: 0,
  totalPrice: "0.00",
  isGuest: false,
  isLoading: true,
  isCartOpen: false,
  openCart: () => { },
  closeCart: () => { },
  addItem: async () => { },
  updateQty: async () => { },
  removeItem: async () => { },
  refresh: async () => { },
  clearCart: () => { },
};

export const CartContext = createContext<CartContextValue>(defaultValue);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Keep a stable ref to the cart for optimistic revert without stale closures
  const cartRef = useRef<Cart | null>(null);
  cartRef.current = cart;

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  /**
   * Fetch the cart from the server.
   * Works for both authenticated users (sends JWT) and guests (browser sends
   * the HttpOnly `guest_cart_token` cookie automatically via credentials:"include").
   * Per the docs: if the guest has no cart, the backend returns an empty cart
   * object without creating a DB record — so we always call this regardless of auth.
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Pass JWT if available; guests rely on the HttpOnly cookie (sent via credentials:"include")
      const data = await fetchCart(token ?? undefined);
      setCart(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        // Truly unauthenticated and no guest cookie — clear cart silently
        setCart(null);
      } else {
        console.warn("[Cart] Refresh failed:", err?.message ?? err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Re-fetch whenever auth state changes (covers the post-login merge case).
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Add an item. Supports both guests and authenticated users.
   * Uses optimistic update: immediately adds the item to local state,
   * then reverts if the server rejects with INSUFFICIENT_STOCK or VARIANT_NOT_AVAILABLE.
   */
  const addItem = useCallback(async (variantId: string, qty = 1, mediaId?: string) => {
    const previous = cartRef.current;

    // Optimistic: bump totalItems for badge responsiveness
    setCart(prev => {
      if (!prev) return prev;
      return { ...prev, total_quantity: prev.total_quantity + qty };
    });
    try {
      await addToCart(variantId, qty, token ?? undefined, mediaId);
      await refresh();
      // Auto-open drawer on desktop when item is added
      openCart();
    } catch (err) {
      // Revert optimistic update
      setCart(previous);
      if (err instanceof ApiError) {
        // Surface specific stock errors to callers
        throw err;
      }
      console.error("[Cart] Add item failed:", err);
      throw err;
    }
  }, [token]);

  /**
   * Update the quantity of an existing cart item.
   * Setting qty to 0 removes the item (per backend spec).
   * Optimistic: applies the change immediately and reverts on error.
   */
  const updateQty = useCallback(async (itemId: string, qty: number) => {
    const previous = cartRef.current;
    // Optimistic update
    setCart(prev => {
      if (!prev) return prev;
      if (qty === 0) {
        const removed = prev.items.find(i => i.id === itemId);
        return {
          ...prev,
          items: prev.items.filter(i => i.id !== itemId),
          total_quantity: prev.total_quantity - (removed?.quantity ?? 0),
        };
      }
      return {
        ...prev,
        items: prev.items.map(i =>
          i.id === itemId ? { ...i, quantity: qty } : i
        ),
        total_quantity: prev.total_quantity,
      };
    });
    try {
      await updateCartItem(itemId, qty, token ?? undefined);
      await refresh();
    } catch (err) {
      // Revert
      setCart(previous);

      const msg = (err as any)?.message || "";
      const isStockError = msg.toLowerCase().includes("inventory") || msg.toLowerCase().includes("stock");

      if (!isStockError) {
        console.error("[Cart] Update quantity failed:", err);
      }
      throw err;
    }
  }, [token]);

  /**
   * Remove an item. Uses DELETE endpoint.
   * Optimistic: removes from list immediately.
   */
  const removeItem = useCallback(async (itemId: string) => {
    const previous = cartRef.current;
    // Optimistic remove
    setCart(prev => {
      if (!prev) return prev;
      const removed = prev.items.find(i => i.id === itemId);
      return {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId),
        total_quantity: prev.total_quantity - (removed?.quantity ?? 0),
      };
    });
    try {
      await removeFromCart(itemId, token ?? undefined);
      await refresh();
    } catch (err) {
      setCart(previous);
      console.error("[Cart] Remove item failed:", err);
      throw err;
    }
  }, [token]);

  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  const items = useMemo(() => cart?.items ?? [], [cart]);
  const totalItems = useMemo(() => cart?.total_quantity ?? 0, [cart]);
  const totalPrice = useMemo(() => cart?.total_price ?? "0.00", [cart]);
  const isGuest = useMemo(() => cart?.is_guest ?? !isAuthenticated, [cart, isAuthenticated]);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    items,
    totalItems,
    totalPrice,
    isGuest,
    isLoading,
    addItem,
    updateQty,
    removeItem,
    refresh,
    clearCart,
    isCartOpen,
    openCart,
    closeCart,
  }), [cart, items, totalItems, totalPrice, isGuest, isLoading, addItem, updateQty, removeItem, refresh, clearCart, isCartOpen, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
