export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
    login_hint?: string;
  };
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  token?: string;
  body?: Record<string, unknown> | string | FormData;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public loginHint?: string,
    public data?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

  // Ensure we have the /api/v1 prefix only if it's not already in baseUrl or endpoint
  let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (!path.startsWith("http") && !path.startsWith("/api/v1") && !baseUrl.endsWith("/api/v1")) {
    path = `/api/v1${path}`;
  }

  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  if (process.env.NODE_ENV === "development") {
    console.log(`[API Request] ${options.method ?? "GET"} ${url}`);
  }

  // If body is FormData, skip Content-Type — browser sets multipart/form-data + boundary automatically
  const isFormData = options.body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.token) {
    requestHeaders.Authorization = `Bearer ${options.token}`;
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: requestHeaders,
    body: isFormData
      ? (options.body as FormData)
      : typeof options.body === "string"
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
    credentials: "include",
  };

  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => null)) as ApiResponse<T>;

  if (!response.ok || (payload && payload.success === false)) {
    const errorData = payload?.error || (payload as any)?.detail || payload;

    let extractedMessage = typeof errorData === 'string' ? errorData : (errorData?.message || payload?.message);

    // Fallback for DRF-style dictionary errors like {"quantity": ["Not enough stock."]}
    if (!extractedMessage && errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
      const firstVal = Object.values(errorData)[0];
      if (Array.isArray(firstVal) && typeof firstVal[0] === 'string') {
        extractedMessage = firstVal[0];
      } else if (typeof firstVal === 'string') {
        extractedMessage = firstVal;
      }
    }

    const message = extractedMessage || response.statusText || "API request failed";
    const code = errorData?.code || (response.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR");
    const loginHint = errorData?.login_hint;
    // Carry the backend field-level validation errors (e.g. { payment_type: ["required"] })
    const fieldData = errorData?.data ?? null;

    // Log specifics if it's an auth failure to help debugging
    if (response.status === 401 || code === "NOT_AUTHENTICATED") {
      console.warn(`[API] Auth Failure (${code}): ${message}${loginHint ? ` Hint: ${loginHint}` : ""}`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth-unauthorized", { detail: { loginHint } }));
      }
    }

    throw new ApiError(code, message, response.status, loginHint, fieldData);
  }

  // Pagination-Aware Unwrapping: 
  // If the payload has pagination metadata (count, next, results), return the whole thing.
  // Otherwise, fallback to the 'data' field or the raw payload.
  const hasPagination = payload && typeof payload === 'object' && ('count' in payload || 'results' in payload);
  if (hasPagination) return payload as T;

  return (payload?.data !== undefined ? payload.data : payload) as T;
}
