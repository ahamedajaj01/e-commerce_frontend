import { ApiError } from "@/lib/api/client";
import type { Cart } from "@/types/cart";
import {
  buildGuestTokenHeaders,
  captureGuestTokenFromResponse,
} from "@/lib/api/guestToken";

// ─── Cart-aware fetch ─────────────────────────────────────────────────────────
//
// We cannot reuse the generic apiClient for cart endpoints because we need
// access to the raw Response object *before* body parsing in order to
// capture the `X-Guest-Token` response header.
//
// Pattern implemented:
//  1. On every cart request  → attach X-Guest-Token from localStorage (if any)
//  2. On every cart response → persist X-Guest-Token to localStorage (if returned)
//  3. Always send credentials: "include" so the server-side cookie also works
//     (dual-layer: cookie + localStorage header for maximum browser compat)

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function cartUrl(path: string): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalised}`;
}

async function cartFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    token?: string;
  } = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  // Build request headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Attach stored guest token as a header fallback (cookie-blocking browsers)
    ...buildGuestTokenHeaders(),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(cartUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // Required for the cookie-based session to work cross-origin
  });

  // ── Dual-layer: capture X-Guest-Token on every cart response ───────────────
  captureGuestTokenFromResponse(response);

  const payload = await response.json().catch(() => null);

  if (!response.ok || (payload && payload.success === false)) {
    const errorData = payload?.error || (payload as any)?.detail || payload;
    let message =
      typeof errorData === "string"
        ? errorData
        : errorData?.message || payload?.message;

    // DRF-style field error dicts: {"quantity": ["Not enough stock."]}
    if (!message && errorData && typeof errorData === "object" && !Array.isArray(errorData)) {
      const firstVal = Object.values(errorData)[0];
      if (Array.isArray(firstVal) && typeof firstVal[0] === "string") {
        message = firstVal[0];
      } else if (typeof firstVal === "string") {
        message = firstVal;
      }
    }

    const finalMessage = message || response.statusText || "Cart request failed";
    const code = errorData?.code || (response.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR");
    throw new ApiError(code, finalMessage, response.status, errorData?.login_hint);
  }

  // Unwrap DRF envelope if present
  const hasPagination =
    payload && typeof payload === "object" && ("count" in payload || "results" in payload);
  if (hasPagination) return payload as T;

  return (payload?.data !== undefined ? payload.data : payload) as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchCart(token?: string): Promise<Cart> {
  return cartFetch<Cart>("/storefront/cart/", { token });
}

export async function addToCart(
  variantId: string,
  quantity: number,
  token?: string,
  mediaId?: string
): Promise<Cart> {
  const body: Record<string, any> = { variant_id: variantId, quantity };
  if (mediaId) body.media_id = mediaId;
  return cartFetch<Cart>("/storefront/cart/items/", {
    method: "POST",
    body,
    token,
  });
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
  token?: string
): Promise<Cart> {
  return cartFetch<Cart>(`/storefront/cart/items/${itemId}/`, {
    method: "PATCH",
    body: { quantity },
    token,
  });
}

export async function removeFromCart(itemId: string, token?: string): Promise<Cart> {
  return cartFetch<Cart>(`/storefront/cart/items/${itemId}/`, {
    method: "DELETE",
    token,
  });
}
