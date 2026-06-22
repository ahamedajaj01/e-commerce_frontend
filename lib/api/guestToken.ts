/**
 * Guest Cart Token — Dual-Layer Persistence Utility
 *
 * Persists the `X-Guest-Token` returned by the backend in localStorage.
 * This is a fallback for browsers (Safari, hardened Chrome) that block
 * third-party cookies, which would otherwise silently lose the session.
 */

const STORAGE_KEY = "guest_cart_token";

export function getGuestToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
}

export function setGuestToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, token);
}

export function clearGuestToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Reads the `X-Guest-Token` header from a Response and persists it
 * to localStorage if present. Call this after every cart API response.
 */
export function captureGuestTokenFromResponse(response: Response): void {
    const token = response.headers.get("X-Guest-Token");
    if (token) {
        setGuestToken(token);
    }
}

/**
 * Returns a headers object that includes the persisted guest token header
 * if one exists. Merge this into every cart request.
 */
export function buildGuestTokenHeaders(): Record<string, string> {
    const token = getGuestToken();
    if (!token) return {};
    return { "X-Guest-Token": token };
}
