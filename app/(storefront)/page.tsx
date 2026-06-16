import React from "react";

import { ProductCard } from "@/components/storefront/ProductCard";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import TestimonialSection from "@/components/storefront/TestimonialSection";
import FAQSection from "@/components/storefront/FAQSection";
import { HeroSlider } from "@/components/storefront/HeroSlider";
import { CmsService } from "@/lib/services/cms";
import { getMediaUrl } from "@/lib/utils";
import Link from "next/link";

export default async function StorefrontHomePage() {
  const sections = await CmsService.getHomepageSections() || [];

  let homepageProducts: any[] = [];
  let customCollections: any[] = [];
  let campaignBanners: any[] = [];
  try {
    // Consolidated parallel fetch for all promotion segments
    const [campaignPromos, bannerPromos, systemPromos, exclusivePromosRaw] = await Promise.all([
      import("@/lib/api/cms").then(m => m.fetchStorefrontPromotions("CAMPAIGN")),
      import("@/lib/api/cms").then(m => m.fetchStorefrontPromotions("BANNER")),
      import("@/lib/api/cms").then(m => m.fetchStorefrontPromotions("SYSTEM")),
      import("@/lib/api/cms").then(m => m.fetchStorefrontPromotions("EXCLUSIVE"))
    ]);

    const promotions = [...campaignPromos, ...bannerPromos, ...systemPromos, ...exclusivePromosRaw];

    // Robust multi-source discovery for 'Trending' products on homepage
    // We check for "Homepage Selection" first, then "Trending Now" as a fallback
    // Discover primary homepage selection across SYSTEM and CAMPAIGN segments (for migration)
    const homePromo = [...systemPromos, ...campaignPromos].find(p =>
      p.title === "Homepage Selection" ||
      p.title === "Trending Now" ||
      p.title.toLowerCase().replace(/\s+/g, '-') === "homepage-selection" ||
      p.title.toLowerCase().replace(/\s+/g, '-') === "trending-now"
    );

    if (homePromo && Array.isArray(homePromo.products) && homePromo.products.length > 0) {
      homepageProducts = homePromo.products;
    } else {
      const featured = await import("@/lib/api/catalog").then(m => m.fetchFeaturedProducts());
      homepageProducts = featured.slice(0, 8);
    }

    // Strictly fetch collections created via the Exclusive Collection dashboard
    // Consolidate exclusive collections from dedicated EXCLUSIVE segments and legacy CAMPAIGN fallback
    const filteredExclusive = [...exclusivePromosRaw, ...campaignPromos].filter(p =>
      p.promotion_type === "EXCLUSIVE" ||
      p.description === "Storefront Exclusive Collection" ||
      (p as any).slug?.includes("exclusive")
    );
    customCollections = Array.from(new Map(filteredExclusive.map(p => [p.id, p])).values());

    // Campaign banners: visible promotions explicitly tagged as BANNER
    campaignBanners = bannerPromos.filter(p =>
      p.is_visible &&
      p.image
    ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  } catch (e) {
    console.warn("Failed to fetch curated collections, attempting catalog fallback", e);
    const featuredFallback = await import("@/lib/api/catalog").then(m => m.fetchFeaturedProducts()).catch(() => []);
    homepageProducts = featuredFallback.slice(0, 8);
  }

  // Separate non-banner sections from CMS
  const otherSections = sections.filter(s => s.section_type !== "BANNER");

  return (
    <div className="bg-white text-slate-900">
      <main className="space-y-0">

        {/* 1. Hero Banners — Rendered as a Slider */}
        <HeroSlider campaigns={campaignBanners} />

        {/* 2. Trending Products (Catalog Selection) */}
        {homepageProducts.length > 0 && <TrendingSection products={homepageProducts} />}

        {/* 3. Exclusive Collections (Catalog Selection) */}
        {customCollections.length > 0 && <CategoryShowcase collections={customCollections} />}

        {/* 4. Other Visual Banners (From Marketing) */}
        {otherSections.map((section, idx) => (
          <React.Fragment key={section.id}>
            {section.section_type === "BANNER_GRID" && (
              <section className="bg-white pb-16 sm:pb-24 pt-8 sm:pt-12">
                <ResponsiveContainer className="max-w-5xl">
                  <div className="grid gap-4 sm:gap-x-6 sm:gap-y-12 grid-cols-1 sm:grid-cols-2">
                    {section.data.items?.map((banner: any, bIdx: number) => (
                      <Link key={bIdx} href={banner.cta_link || "#"} className="group relative block aspect-[4/5] overflow-hidden bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <img
                          src={getMediaUrl(banner.image)}
                          alt={banner.title}
                          className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent transition-opacity opacity-80 group-hover:opacity-100" />
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] bg-white p-4 text-center rounded-2xl border border-slate-100 shadow-xl transition-transform duration-500 group-hover:-translate-y-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-none truncate">
                            {banner.title}
                          </h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ResponsiveContainer>
              </section>
            )}
          </React.Fragment>
        ))}

        <TestimonialSection items={[]} />
        <FAQSection items={[]} />
      </main>
    </div>
  );
}

function TrendingSection({ products }: { products: any[] }) {
  return (
    <section className="bg-white pt-14 sm:pt-24 pb-8 sm:pb-12">
      <ResponsiveContainer>
        <div className="mb-8 sm:mb-12">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.6em] font-black text-slate-400 mb-2 text-center md:text-left">Handpicked Elegance</p>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight text-center md:text-left">Trending Now</h2>
        </div>
        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </ResponsiveContainer>
    </section>
  );
}

function CategoryShowcase({ collections }: { collections: any[] }) {
  return (
    <section className="bg-white pb-14 sm:pb-24 pt-12 sm:pt-16">
      <ResponsiveContainer className="max-w-5xl">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-900">The Collection</h2>
        </div>
        <div className="grid gap-4 sm:gap-8 grid-cols-2">
          {collections.map((col: any, idx: number) => {
            const imageSrc = col.image?.includes('http') ? col.image : col.image ? getMediaUrl(col.image) : "https://dummyimage.com/600x800/f3f4f6/475569&text=No+Image";
            return (
              <Link key={idx} href={`/collections/${col.slug || col.id}`} className="group relative block aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-slate-50 rounded-[2rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50">
                <img
                  src={imageSrc}
                  alt={col.title}
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-500" />
                <div className="absolute bottom-4 sm:bottom-10 left-4 sm:left-10 right-4 sm:right-10 bg-white/95 backdrop-blur-md p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-lg transition-transform duration-500 group-hover:-translate-y-2 text-center">
                  <h3 className="text-xs sm:text-lg font-black text-slate-900 uppercase tracking-tight leading-none truncate">
                    {col.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </ResponsiveContainer>
    </section>
  );
}

