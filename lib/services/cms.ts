import { fetchHomepageLayout, fetchDiscoveryFeedBySlug, fetchDiscoveryFeeds } from "@/lib/api/cms";
import type { HomepageSection, DiscoveryFeedItem } from "@/types/cms";

/**
 * PRODUCTION-GRADE CMS SERVICE
 * Safely handles API response mapping, pagination unwrapping, 
 * and data normalization for a scalable storefront.
 */
export const CmsService = {
    /**
     * Fetches and normalizes homepage sections with safety fallbacks
     */
    async getHomepageSections(): Promise<HomepageSection[]> {
        try {
            const data = await fetchHomepageLayout();
            const raw = Array.isArray(data) ? data : (data as any)?.results || (data as any)?.sections || [];
            return [...raw].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        } catch (e) {
            console.error("[CmsService] Homepage load failed:", e);
            return [];
        }
    },

    /**
   * Fetches specific discovery feed items with aggressive fallback logic.
   * If the requested slug is missing, it will try to find ANY available feed 
   * to ensure storefront content is never empty.
   */
    async getDiscoveryFeed(slug: string): Promise<DiscoveryFeedItem[]> {
        // 1. Try fetching the specific slug
        let res;
        try {
            res = await fetchDiscoveryFeedBySlug(slug);
        } catch (e: any) {
            // If it's a 404, the section is deactivated. THROW so the page can 404.
            if (e?.response?.status === 404 || e?.status === 404) {
                console.warn(`[CmsService] Section '${slug}' is deactivated via Kill Switch.`);
                throw e;
            }
            console.error(`[CmsService] Failed to fetch feed '${slug}':`, e);
        }

        // 2. Identify "Pseudo-Success" failures
        const isMissing = !res ||
            (res as any)?.message?.includes("not found") ||
            (!Array.isArray(res) && !(res as any)?.id && !(res as any)?.items);

        // 3. Fallback: ONLY if it wasn't a 404 Kill Switch
        if (isMissing) {
            const allFeedsRes = await fetchDiscoveryFeeds().catch(() => []);
            const feedsArr = Array.isArray(allFeedsRes) ? allFeedsRes : (allFeedsRes as any)?.results || (allFeedsRes as any)?.data || [];

            if (feedsArr.length > 0) {
                res = feedsArr.find((f: any) => (f.items?.length > 0 || f.results?.length > 0)) || feedsArr[0];
                console.log(`[CmsService] Slug '${slug}' was empty. Falling back:`, (res as any)?.name);
            }
        }

        if (!res) return [];

        const data = (res as any)?.data || res;
        const items = (data as any)?.items || (data as any)?.results || (Array.isArray(data) ? data : []);
        return Array.isArray(items) ? items.filter((it: any) => it) : [];
    }
};
