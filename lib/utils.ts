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

    // 1. Already an absolute URL — return as-is
    if (/^(https?:|blob:|data:)/i.test(trimmed)) {
        return trimmed;
    }

    // 2. Cloudinary protocol-relative URL
    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }

    // 3. Construct full URL using the bare backend root
    const backendRoot = (
        process.env.NEXT_PUBLIC_BACKEND_URL ??
        (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/v1\/?$/, "")
    ).replace(/\/$/, "");

    // Strip leading slashes from the relative path
    let path = trimmed.replace(/^\/+/, "");

    // 4. Defensive Prefixing: If it doesn't have a common prefix, assume it's a media asset
    const hasCommonPrefix = /^(media|static|products|uploads|assets)\//i.test(path);
    if (!hasCommonPrefix) {
        path = `media/${path}`;
    }

    return backendRoot ? `${backendRoot}/${path}` : `/${path}`;
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
