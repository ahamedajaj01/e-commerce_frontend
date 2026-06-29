import { apiClient } from "./client";
import type {
    Order,
    OrderListResponse,
    OrderStatusUpdate,
    TrackedOrder
} from "@/types/order";

// ─── STOREFRONT API ─────────────────────────────────────────────────────────

/**
 * List orders for the current customer
 * GET /api/v1/storefront/orders/
 */
export async function fetchMyOrders(token: string): Promise<OrderListResponse> {
    return apiClient<OrderListResponse>("/storefront/orders/", {
        token
    });
}

/**
 * Get details for a specific order
 * GET /api/v1/storefront/orders/{uuid}/
 */
export async function fetchOrderDetails(id: string, token: string): Promise<Order> {
    return apiClient<Order>(`/storefront/orders/${id}/`, {
        token
    });
}

/**
 * Public Order Tracking (No Auth Required)
 * GET /api/v1/storefront/orders/track/?number=ORD-XYZ
 */
export async function trackOrder(orderNumber: string): Promise<TrackedOrder> {
    return apiClient<TrackedOrder>(`/storefront/orders/track/?number=${orderNumber}`);
}

// ─── BACKOFFICE API ─────────────────────────────────────────────────────────

/**
 * List all orders for administrative purposes
 * GET /api/v1/backoffice/orders/
 */
export async function fetchBackofficeOrders(params?: {
    search?: string;
    status?: string;
    page?: number;
    token?: string;
}): Promise<OrderListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);
    if (params?.page) query.append("page", params.page.toString());

    return apiClient<OrderListResponse>(`/backoffice/orders/?${query.toString()}`, {
        token: params?.token
    });
}

/**
 * Get full order details for administrative purposes
 * GET /api/v1/backoffice/orders/{uuid}/
 */
export async function fetchBackofficeOrderDetails(id: string, token: string): Promise<Order> {
    return apiClient<Order>(`/backoffice/orders/${id}/`, {
        token
    });
}

/**
 * Update order status
 * PATCH /api/v1/backoffice/orders/{uuid}/
 */
export async function updateOrderStatus(
    id: string,
    data: OrderStatusUpdate,
    token: string
): Promise<Order> {
    return apiClient<Order>(`/backoffice/orders/${id}/`, {
        method: "PATCH",
        body: data as any,
        token
    });
}
