import { apiClient } from "./client";

export interface DashboardStats {
    active_orders: number;
    low_stock_count: number;
    monthly_revenue: string;
    active_campaigns: number;
    recent_transactions: {
        id: string;
        customer: string;
        amount: string;
        status: string;
        timestamp: string;
    }[];
}

export async function fetchDashboardStats(token?: string): Promise<DashboardStats> {
    try {
        return await apiClient<DashboardStats>("/backoffice/analytics/summary", { token });
    } catch (err: any) {
        if (err.status === 404) {
            console.warn("Analytics endpoint not found. Backend might not have analytics implemented yet.");
            return {
                active_orders: 0,
                low_stock_count: 0,
                monthly_revenue: "NPR 0",
                active_campaigns: 0,
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
