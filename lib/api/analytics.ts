import { apiClient } from "./client";

export interface DashboardStats {
    total_revenue: number;
    total_orders: number;
    pending_orders: number;
    shipped_orders: number;
    processing_orders: number;
    today_orders: number;
    currency: string;
    recent_transactions: {
        transaction_id: string;
        customer_identity: string;
        items: number;
        verification: string;
        lifecycle: string;
        progress: number;
        settlement: number;
        created_at: string;
    }[];
}

export async function fetchDashboardStats(token?: string): Promise<DashboardStats> {
    try {
        return await apiClient<DashboardStats>("/backoffice/analytics/summary", { token });
    } catch (err: any) {
        if (err.status === 404) {
            console.warn("Analytics endpoint not found. Backend might not have analytics implemented yet.");
            return {
                total_revenue: 0,
                total_orders: 0,
                pending_orders: 0,
                shipped_orders: 0,
                processing_orders: 0,
                today_orders: 0,
                currency: "NPR",
                recent_transactions: []
            };
        }
        throw err;
    }
}
export interface LowStockItem {
    variant_id: string;
    sku: string;
    product_name: string;
    size: string;
    color: string;
    available_quantity: number;
    is_unlimited_stock: boolean;
}

export async function fetchLowStockAlerts(token?: string): Promise<LowStockItem[]> {
    try {
        const data = await apiClient<any>("/backoffice/inventory/low-stock", { token });
        const items: LowStockItem[] = Array.isArray(data) ? data : data?.results || [];
        // Filter out unlimited-stock items — they never actually run out
        return items.filter((item) => !item.is_unlimited_stock);
    } catch {
        return [];
    }
}
