import { apiClient } from "./client";
import type {
    PaymentMethod,
    PaymentProvider,
    Transaction,
    TransactionListResponse,
    TransactionVerification
} from "@/types/payment";

// ─── STOREFRONT API ─────────────────────────────────────────────────────────

/**
 * List active payment methods for checkout
 * GET /api/v1/payments/storefront/methods/
 */
export async function fetchStorefrontPaymentMethods(token?: string): Promise<PaymentMethod[]> {
    return apiClient<PaymentMethod[]>("/storefront/payments/methods/", { token });
}

/**
 * Step 3: Create a transaction record linked to an order
 * POST /api/v1/payments/storefront/transactions/
 */
export async function createStorefrontTransaction(data: { order_id: string; payment_method_id: string }, token?: string): Promise<Transaction> {
    return apiClient<Transaction>("/storefront/payments/transactions/", {
        method: "POST",
        body: data as any,
        token
    });
}

/**
 * Step 4: Submit proof of payment for a transaction
 * POST /api/v1/payments/storefront/transactions/{id}/proof/
 */
export async function submitPaymentProof(transactionId: string, proofImage: File, token?: string): Promise<Transaction> {
    const formData = new FormData();
    formData.append("image", proofImage);

    return apiClient<Transaction>(`/storefront/payments/transactions/${transactionId}/proof/`, {
        method: "POST",
        body: formData as any,
        token
    });
}

/**
 * Get current status of a transaction
 * GET /api/v1/payments/storefront/transactions/{id}/
 */
export async function fetchStorefrontTransaction(id: string, token?: string): Promise<Transaction> {
    return apiClient<Transaction>(`/storefront/payments/transactions/${id}/`, { token });
}

// ─── BACKOFFICE API ─────────────────────────────────────────────────────────

/**
 * List and manage payment providers
 */
export async function fetchPaymentProviders(token: string): Promise<PaymentProvider[]> {
    return apiClient<PaymentProvider[]>("/backoffice/payments/providers/", { token });
}

export async function createPaymentProvider(data: Partial<PaymentProvider>, token: string): Promise<PaymentProvider> {
    return apiClient<PaymentProvider>("/backoffice/payments/providers/", {
        method: "POST",
        body: data as any,
        token
    });
}

export async function updatePaymentProvider(id: string, data: Partial<PaymentProvider>, token: string): Promise<PaymentProvider> {
    return apiClient<PaymentProvider>(`/backoffice/payments/providers/${id}/`, {
        method: "PATCH",
        body: data as any,
        token
    });
}

/**
 * List and manage payment methods
 */
export async function fetchPaymentMethods(token: string): Promise<PaymentMethod[]> {
    return apiClient<PaymentMethod[]>("/backoffice/payments/methods/", { token });
}

export async function createPaymentMethod(data: Partial<PaymentMethod> | FormData, token: string): Promise<PaymentMethod> {
    return apiClient<PaymentMethod>("/backoffice/payments/methods/", {
        method: "POST",
        body: data as any,
        token
    });
}

export async function updatePaymentMethod(id: string, data: Partial<PaymentMethod> | FormData, token: string): Promise<PaymentMethod> {
    return apiClient<PaymentMethod>(`/backoffice/payments/methods/${id}/`, {
        method: "PATCH",
        body: data as any,
        token
    });
}

export async function deletePaymentMethod(id: string, token: string): Promise<void> {
    return apiClient<void>(`/backoffice/payments/methods/${id}/`, {
        method: "DELETE",
        token
    });
}

/**
 * Operations: Transactions verify/list
 */
export async function fetchBackofficeTransactions(params: {
    search?: string;
    status?: string;
    page?: number;
    order_id?: string;
    token: string;
}): Promise<TransactionListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", params.page.toString());
    if (params.order_id) query.append("order_id", params.order_id);

    return apiClient<TransactionListResponse>(`/backoffice/payments/transactions/?${query.toString()}`, {
        token: params.token
    });
}

export async function fetchBackofficeTransactionDetails(id: string, token: string): Promise<Transaction> {
    return apiClient<Transaction>(`/backoffice/payments/transactions/${id}/`, { token });
}

export async function verifyTransaction(id: string, data: TransactionVerification, token: string): Promise<Transaction> {
    return apiClient<Transaction>(`/backoffice/payments/transactions/${id}/verify/`, {
        method: "POST",
        body: data as any,
        token
    });
}
