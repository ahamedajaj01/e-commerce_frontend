import { apiClient } from "@/lib/api/client";
import { getMediaUrl } from "@/lib/utils";

export interface InventoryItem {
    id: string;
    sku: string;
    product_name: string;
    product_image?: string | null;
    variant_info: string;
    available_quantity: number;
    low_stock_threshold: number;
    reserved_quantity?: number;
    total_quantity?: number;
    is_unlimited?: boolean;
    source_type?: "CATALOG" | "MEDIA";
    is_stub?: boolean;
    status?: "SYNCHRONIZED" | "INCOMPLETE" | "PENDING_CONFIGURATION";
}

export type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";

/** GET /api/v1/backoffice/inventory/ - Standard Grade Production View */
export async function fetchInventory(token?: string, type?: "VIDEO_PRODUCT" | "CATALOG_PRODUCT", page: number = 1, search?: string): Promise<{ items: InventoryItem[], count: number }> {
    const url = `/backoffice/inventory/?page=${page}&page_size=20${type ? `&type=${type}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    const data = await apiClient<any>(url, { token });

    // Hyper-Scanner: Detects results in data.results, data.data, or top-level
    const items = data?.results || data?.data || (Array.isArray(data) ? data : []);

    // Deep-Search for Count: Looks for any field that suggests a total
    let count = data?.meta?.total_items || data?.total_count || data?.count || data?.total || data?.total_items || (Array.isArray(data) ? data.length : (data?.data?.length || 0));

    // Absolute Fallback: If we have items but count is 0, the count is at least the current items length
    if (!count && items.length > 0) {
        count = items.length;
    }

    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/v1\/?$/, "");

    const mappedItems = items.map((item: any) => {
        // Backend returns image under item.variant.image_url
        const variantImage = item.variant?.image_url || item.variant?.image || item.variant?.product_image || null;
        const img = variantImage ? getMediaUrl(variantImage) : null;

        const pType = item.variant?.product_type?.toUpperCase() || "";
        const isVideo = pType.includes("VIDEO") || pType.includes("DISCOVERY") || pType.includes("BROADCAST");

        return {
            id: item.id,
            sku: item.variant?.sku || "N/A-SKU",
            product_name: item.variant?.product_name || "Unknown Product",
            product_image: img,
            variant_info: `${item.variant?.size || ""} ${item.variant?.color || ""}`.trim() || "Standard",
            available_quantity: item.available_quantity ?? 0,
            low_stock_threshold: item.low_stock_threshold ?? 5,
            reserved_quantity: item.reserved_quantity ?? 0,
            total_quantity: item.total_quantity ?? 0,
            is_unlimited: item.is_unlimited ?? false,
            source_type: (isVideo ? "MEDIA" : "CATALOG") as "CATALOG" | "MEDIA",
            is_stub: item.is_stub ?? false,
            status: item.status || "SYNCHRONIZED"
        };
    }) as InventoryItem[];

    return { items: mappedItems, count };
}


/** GET /api/v1/backoffice/inventory/low-stock/ */
export async function fetchLowStock(token?: string): Promise<InventoryItem[]> {
    const data = await apiClient<any>("/backoffice/inventory/low-stock/", { token });
    return Array.isArray(data) ? data : data?.results || [];
}

/** POST /api/v1/backoffice/inventory/adjust/ */
export async function adjustInventory(
    variantId: string,
    quantity: number,
    movementType: MovementType,
    note?: string,
    token?: string
): Promise<void> {
    await apiClient<void>("/backoffice/inventory/adjust/", {
        method: "POST",
        body: {
            variant_id: variantId,
            quantity,
            movement_type: movementType,
            note,
        },
        token,
    });
}
