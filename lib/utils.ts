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

    // 1. If it's already an absolute URL (http, https, blob, or data), return as is
    if (/^(https?:|blob:|data:)/i.test(trimmed)) {
        return trimmed;
    }

    // 2. Handle Cloudinary specific relative paths if they somehow leak through
    // (though our backend now sends absolute URLs)
    if (trimmed.includes('res.cloudinary.com')) {
        return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    }

    // 3. Handle local media paths
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    let baseOrigin = "";

    try {
        if (apiUrl) {
            const url = new URL(apiUrl);
            baseOrigin = url.origin;
        }
    } catch (e) {
        baseOrigin = apiUrl.replace(/\/api\/v1\/?$/, "");
    }

    // Clean the path
    let path = trimmed.replace(/^\/+/, "");

    // If it's already a full relative path to media, don't double-prefix
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
