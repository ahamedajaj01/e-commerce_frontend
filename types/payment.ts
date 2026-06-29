export type PaymentStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface PaymentProvider {
    id: string;
    name: string;
    code: string;
    type: string;          // frontend form field (mapped from provider_type on receive)
    provider_type?: string; // actual backend field name (MANUAL | GATEWAY)
    is_active: boolean;
    config?: Record<string, any>;
    credentials?: Record<string, any>;
}

export interface PaymentMethod {
    id: string;
    name: string;
    code: string;
    payment_type?: 'MANUAL' | 'GATEWAY';
    type?: string; // Internal frontend use or if backend eventually supports it
    description?: string;
    instructions?: string;
    qr_image?: string;
    is_active: boolean;
    requires_proof: boolean;
    display_order: number;
    provider_id?: string;
    provider?: PaymentProvider;
}

export interface Transaction {
    id: string;
    order_id: string;
    order_number: string;
    customer_name: string;
    payment_method_id: string;
    payment_method_name: string;
    amount: string;
    status: PaymentStatus;
    proof_image?: string;
    image?: string;
    proofs?: Array<{
        id: string;
        image: string;
        image_url?: string;
        uploaded_at: string;
    }>;
    admin_notes?: string;
    verification_history?: any[];
    created_at: string;
    updated_at: string;
}

export interface TransactionListResponse {
    results: Transaction[];
    count: number;
}

export interface PaymentProofSubmission {
    proof_image: string; // URL from upload
}

export interface TransactionVerification {
    approve: boolean;
    notes?: string;
}
