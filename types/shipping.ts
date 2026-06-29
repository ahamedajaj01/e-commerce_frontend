// ─── Backoffice Types ──────────────────────────────────────────────────────

/**
 * A single shipping rule returned by the backend (ShippingRule model).
 */
export interface ShippingRule {
    id: string;
    title: string;
    province: string;
    district?: string;
    city_or_municipality?: string;
    shipping_fee: number;
    transit_days_min?: number;
    transit_days_max?: number;
    estimated_days: string;
    is_default: boolean;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Payload for creating/updating a shipping rule.
 */
export interface CreateShippingRule {
    title: string;
    province?: string;
    district?: string;
    city_or_municipality?: string;
    shipping_fee: number;
    transit_days_min?: number;
    transit_days_max?: number;
    estimated_days: string;
    is_default: boolean;
    is_active: boolean;
}

// ─── Storefront Types ──────────────────────────────────────────────────────

/**
 * The single matched rule returned by the calculation endpoint.
 */
export interface ShippingCalculationResult {
    rule_id: string;
    title: string;
    fee: number | string;
    estimated_days: string;
    transit_days_min?: number;
    transit_days_max?: number;
    processing_days_max?: number; // 🆕 Added for pre-calculated warehouse time
    arrival_estimate?: string;     // 🆕 Added for pre-calculated total sum
}

/**
 * Payload for the calculation request.
 */
export interface ShippingCalculationRequest {
    province?: string;
    district?: string;
    city?: string;
    order_total: number;
}

/**
 * Structured success response for calculation.
 */
export interface ShippingCalculationResponse {
    success: boolean;
    data?: ShippingCalculationResult;
    message?: string;
}
