import { apiClient } from "@/lib/api/client";
import type { Cart } from "@/types/cart";

export async function fetchCart(token?: string): Promise<Cart> {
  return apiClient<Cart>("/storefront/cart/", { token });
}

export async function addToCart(variantId: string, quantity: number, token?: string): Promise<Cart> {
  return apiClient<Cart>("/storefront/cart/items/", {
    method: "POST",
    body: { variant_id: variantId, quantity },
    token,
  });
}

export async function updateCartItem(itemId: string, quantity: number, token?: string): Promise<Cart> {
  return apiClient<Cart>(`/storefront/cart/items/${itemId}/`, {
    method: "PATCH",
    body: { quantity },
    token,
  });
}

export async function removeFromCart(itemId: string, token?: string): Promise<Cart> {
  return apiClient<Cart>(`/storefront/cart/items/${itemId}/`, {
    method: "DELETE",
    token,
  });
}
