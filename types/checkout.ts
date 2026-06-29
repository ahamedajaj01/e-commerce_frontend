export interface CheckoutSessionCreate {
    name: string;
    email?: string;
    phone: string;
    province: string;
    district: string;
    city: string;
    street: string;
    shipping_rule_id: string;
    payment_method?: "COD" | "ONLINE";
}

export interface CheckoutSession {
    id: string;
    name: string;
    email: string;
    phone: string;
    province: string;
    district: string;
    city: string;
    street: string;
    total_price: string;
    shipping_fee: string;
    estimated_days: string;
    payment_method: string;
    is_completed: boolean;
    created_at: string;
}

export interface CheckoutCompletionResult {
    order_number: string;
    order_id: string;
}
