import { apiClient } from "./client";
import type {
    ShippingRule,
    CreateShippingRule,
    ShippingCalculationRequest,
    ShippingCalculationResult,
} from "@/types/shipping";
import { buildGuestTokenHeaders } from "./guestToken";

// ─── BACKOFFICE API ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/backoffice/shipping/rules/
 * Returns all shipping rules.
 */
export async function fetchShippingRules(token?: string): Promise<ShippingRule[]> {
    const res = await apiClient<ShippingRule[] | { results: ShippingRule[] }>(
        "/backoffice/shipping/rules/",
        { token }
    );
    return Array.isArray(res) ? res : (res as any).results ?? [];
}

/**
 * POST /api/v1/backoffice/shipping/rules/
 * Creates a new shipping rule.
 */
export async function createShippingRule(
    data: CreateShippingRule,
    token?: string
): Promise<ShippingRule> {
    return apiClient<ShippingRule>("/backoffice/shipping/rules/", {
        method: "POST",
        body: data as any,
        token,
    });
}

/**
 * GET /api/v1/backoffice/shipping/rules/{id}/
 */
export async function fetchShippingRule(id: string, token?: string): Promise<ShippingRule> {
    return apiClient<ShippingRule>(`/backoffice/shipping/rules/${id}/`, { token });
}

/**
 * PATCH /api/v1/backoffice/shipping/rules/{id}/
 * Partially updates a shipping rule.
 */
export async function updateShippingRule(
    id: string,
    data: Partial<CreateShippingRule>,
    token?: string
): Promise<ShippingRule> {
    return apiClient<ShippingRule>(`/backoffice/shipping/rules/${id}/`, {
        method: "PATCH",
        body: data as any,
        token,
    });
}

/**
 * DELETE /api/v1/backoffice/shipping/rules/{id}/
 */
export async function deleteShippingRule(id: string, token?: string): Promise<void> {
    return apiClient<void>(`/backoffice/shipping/rules/${id}/`, {
        method: "DELETE",
        token,
    });
}

/**
 * POST /api/v1/backoffice/shipping/rules/{id}/toggle/
 * Flips is_active without editing the full payload.
 * Returns: { success: true, data: { id, is_active }, message }
 */
export async function toggleShippingRule(
    id: string,
    token?: string
): Promise<{ success: boolean; data: { id: string; is_active: boolean }; message: string }> {
    return apiClient(`/backoffice/shipping/rules/${id}/toggle/`, {
        method: "POST",
        token,
    });
}

// ─── STOREFRONT API ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/storefront/shipping/calculate/
 * Sends extracted address geodata and returns the matched shipping rule.
 */
export async function calculateShipping(
    data: ShippingCalculationRequest,
    token?: string
): Promise<ShippingCalculationResult> {
    return apiClient<ShippingCalculationResult>("/storefront/shipping/calculate/", {
        method: "POST",
        body: data as any,
        token,
        headers: buildGuestTokenHeaders(),
    });
}
