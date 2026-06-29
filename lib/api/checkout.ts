import { apiClient } from "./client";
import { buildGuestTokenHeaders } from "./guestToken";
import type {
    CheckoutSessionCreate,
    CheckoutSession,
    CheckoutCompletionResult
} from "@/types/checkout";

/**
 * Step 1: Create a temporary checkout session
 * POST /api/v1/checkout/storefront/sessions/
 */
export async function createCheckoutSession(data: CheckoutSessionCreate, token?: string): Promise<CheckoutSession> {
    return apiClient<CheckoutSession>("/checkout/storefront/sessions/", {
        method: "POST",
        body: data as any,
        token,
        headers: buildGuestTokenHeaders(),
    });
}

/**
 * Step 1.5: Update session details (e.g. payment method)
 * PATCH /api/v1/checkout/storefront/sessions/{id}/
 */
export async function updateCheckoutSession(id: string, data: Partial<CheckoutSessionCreate>, token?: string): Promise<CheckoutSession> {
    return apiClient<CheckoutSession>(`/checkout/storefront/sessions/${id}/`, {
        method: "PATCH",
        body: data as any,
        token,
        headers: buildGuestTokenHeaders(),
    });
}

/**
 * Step 2: Retrieve an existing checkout session for review
 * GET /api/v1/checkout/storefront/sessions/{uuid}/
 */
export async function fetchCheckoutSession(id: string, token?: string): Promise<CheckoutSession> {
    return apiClient<CheckoutSession>(`/checkout/storefront/sessions/${id}/`, {
        token,
        headers: buildGuestTokenHeaders(),
    });
}

/**
 * Step 3: Promote session to a permanent Order
 * POST /api/v1/checkout/storefront/sessions/{uuid}/complete/
 */
export async function completeCheckoutSession(id: string, token?: string): Promise<CheckoutCompletionResult> {
    return apiClient<CheckoutCompletionResult>(`/checkout/storefront/sessions/${id}/complete/`, {
        method: "POST",
        token,
        headers: buildGuestTokenHeaders(),
    });
}

// ─── BACKOFFICE API ─────────────────────────────────────────────────────────

/**
 * List all checkout sessions (Abandoned Carts / Active Checkouts)
 * GET /api/v1/checkout/backoffice/sessions/
 */
export async function fetchBackofficeCheckoutSessions(token?: string): Promise<CheckoutSession[]> {
    const res = await apiClient<CheckoutSession[] | { results: CheckoutSession[] }>(
        "/checkout/backoffice/sessions/",
        { token }
    );
    return Array.isArray(res) ? res : (res as any).results ?? [];
}

/**
 * View specific checkout session details
 * GET /api/v1/checkout/backoffice/sessions/{id}/
 */
export async function fetchBackofficeCheckoutSession(id: string, token?: string): Promise<CheckoutSession> {
    return apiClient<CheckoutSession>(`/checkout/backoffice/sessions/${id}/`, { token });
}

