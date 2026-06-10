import { fetchProducts } from "@/lib/api/catalog";
import { fetchStorefrontPromotions } from "@/lib/api/cms";
import { CmsService } from "@/lib/services/cms";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@/types/product";
import { getMediaUrl } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let products: Product[] = [];
    let isPromotion = false;
    let bannerImage: string | null = null;
    let pageTitle: string | null = null;
    let pageDescription: string | null = null;
    let apiError_404 = false;

    // Mapping for user's requested sections to Admin Promotion names
    const sectionMap: Record<string, string> = {
        "new-arrivals": "New Arrivals",
        "trending": "Trending Now",
        "best-sellers": "Best Sellers",
        "homepage-selection": "Homepage Selection"
    };

    try {
        const promotions = await fetchStorefrontPromotions();
        const promotion = promotions.find(p =>
            p.id === slug ||
            p.title.toLowerCase().replace(/\s+/g, '-') === slug ||
            (p as any).slug === slug ||
            (sectionMap[slug] && p.title === sectionMap[slug])
        );

        if (promotion && Array.isArray(promotion.products) && promotion.products.length > 0) {
            products = promotion.products;
            isPromotion = true;
            pageTitle = promotion.title;
            pageDescription = promotion.description || null;
            if (promotion.image) {
                bannerImage = promotion.image;
            }
        }
        if (!isPromotion) {
            const filters: any = {};
            if (slug === "new-arrivals") filters.is_new = "true";
            else if (slug === "best-sellers") filters.is_featured = "true";
            else if (slug === "trending") filters.is_trending = "true";
            else {
                const categories = await import("@/lib/api/catalog").then(m => m.fetchCategories());
                const categoryList = Array.isArray(categories) ? categories : (categories as any)?.results || [];

                // Recursive function to find category in nested tree
                const findCategory = (list: any[], target: string): any => {
                    for (const cat of list) {
                        if (cat.slug === target || cat.id === target || cat.id.toString() === target) return cat;
                        if (cat.sub_categories && Array.isArray(cat.sub_categories)) {
                            const found = findCategory(cat.sub_categories, target);
                            if (found) return found;
                        }
                        if (cat.children && Array.isArray(cat.children)) {
                            const found = findCategory(cat.children, target);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const category = findCategory(categoryList, slug);

                if (category) {
                    filters.category = category.id;
                    filters.category_id = category.id;
                    filters.category_slug = category.slug || slug;
                    pageTitle = category.name;
                } else {
                    // Fallback: try slug directly
                    filters.category_slug = slug;
                }
            }
            products = await fetchProducts(filters);
        }
    } catch (e: any) {
        // If it's a 404 (like a deactivated section), we handle it gracefully with not-found
        if (e.status === 404) {
            notFound();
        }
        // Only log "real" system errors (500s, network failures, etc.)
        console.error("Failed to fetch collection data:", e);
    }

    const collectionTitle = pageTitle || slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return (
        <div className="bg-white min-h-screen">
            {/* Header */}
            <div className="pt-6 sm:pt-8 pb-4 px-4 sm:px-6 md:px-8 max-w-screen-2xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-medium text-slate-800 tracking-tight mb-6 sm:mb-10">
                    {collectionTitle}
                </h1>

                {/* Utility Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium pb-4 sm:pb-8 w-full">
                    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
                        <span className="text-slate-400 flex-shrink-0">Filter:</span>
                        <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors flex-shrink-0">
                            Availability
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors flex-shrink-0">
                            Price
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-slate-400">Sort by:</span>
                            <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                                Date, new to old
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                        </div>
                        <span className="text-slate-400 tracking-wide">{products.length} products</span>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 md:px-8 max-w-screen-2xl mx-auto pb-16 sm:pb-32">
                <div className="grid gap-3 sm:gap-x-4 sm:gap-y-8 lg:gap-y-12 grid-cols-2 lg:grid-cols-4">
                    {products.length === 0 ? (
                        <div className="col-span-full py-24 sm:py-40 text-center border border-slate-100 bg-white">
                            <p className="text-slate-400 font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px]">
                                No pieces found in this section.
                            </p>
                        </div>
                    ) : (
                        products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
