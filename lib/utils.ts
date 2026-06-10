import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProductSummary } from "@/types/product";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getMediaUrl(value?: string | null): string | undefined {
    if (!value) return undefined;

    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed) || /^blob:/i.test(trimmed)) return trimmed;

    // Get the base API URL and extract the origin (e.g., http://localhost:8000)
    // Media is served from the origin, not from the /api/v1/ path
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    let baseOrigin = "";

    try {
        if (apiUrl) {
            const url = new URL(apiUrl);
            baseOrigin = url.origin;
        }
    } catch (e) {
        // Fallback to simply removing /api/v1 if present
        baseOrigin = apiUrl.replace(/\/api\/v1\/?$/, "");
    }

    let path = trimmed.replace(/^\/+/, "");

    // If the path doesn't already start with common prefixes, add the /media/ prefix
    if (!path.startsWith("media/") && !path.startsWith("static/") && !path.startsWith("products/media/")) {
        path = `media/${path}`;
    }

    return baseOrigin ? `${baseOrigin}/${path}` : `/${path}`;
}

export function getProductImage(product?: ProductSummary | null): string | undefined {
    if (!product) return undefined;

    // Prioritize the media array per the updated backend spec
    if (product.media && product.media.length > 0) {
        const firstMedia = product.media[0];
        return getMediaUrl(firstMedia.file_url || firstMedia.file);
    }

    // Fallback to legacy root-level fields if no media exists
    if (product.main_image) return getMediaUrl(product.main_image);
    if (product.image) return getMediaUrl(product.image);

    return undefined;
}
