export type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "READY_TO_DISPATCH"
    | "DISPATCHED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";

export interface OrderItemSnapshot {
    id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: number;
    unit_price: string;
    line_total: string;
    thumbnail?: string;
    image?: string;
    variant_image?: string;
}

export interface OrderStatusHistory {
    id: string;
    status: OrderStatus;
    notes?: string;
    created_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    status: OrderStatus;

    // Customer Info
    customer_name: string;
    customer_email?: string;
    customer_phone: string;

    // Shipping Adress
    shipping_province: string;
    shipping_district: string;
    shipping_city: string;
    shipping_street: string;

    // Logistics
    shipping_fee: string;
    estimated_days: string;
    processing_days_max?: number;
    transit_days_min?: number;
    transit_days_max?: number;
    arrival_estimate?: string;

    // Pricing
    total_price: string;
    subtotal: string;
    payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    payment_method_name?: string;

    // Meta
    item_count: number;
    image?: string;
    customer_identity?: string;
    items: OrderItemSnapshot[];
    status_history: OrderStatusHistory[];

    created_at: string;
    updated_at: string;
}

export interface OrderListResponse {
    results: Order[];
    count: number;
    next?: string;
    previous?: string;
}

export interface OrderStatusUpdate {
    status: OrderStatus;
    notes?: string;
}

export interface TrackedOrder {
    id: string;
    order_number: string;
    status: OrderStatus;
    payment_status: string;
    arrival_estimate: string;
    items: OrderItemSnapshot[];
    status_timeline: {
        new_status: OrderStatus;
        created_at: string;
    }[];
    created_at: string;
}
