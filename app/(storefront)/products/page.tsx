import { fetchProducts } from "@/lib/api/catalog";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { ProductCard } from "@/components/storefront/ProductCard";

import type { Product } from "@/types/product";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { search } = await searchParams;
  let products: Product[] = [];
  try {
    // Pass the search param to the API
    products = await fetchProducts(search ? { search } : undefined);
  } catch (e) {
    products = [];
  }

  return (
    <div className="bg-[#faf9f6] min-h-screen">
      <ResponsiveContainer className="space-y-8 sm:space-y-12 py-12 sm:py-24">
        <div className="space-y-3 sm:space-y-6">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] font-black text-fuchsia-600">
            {search ? `Searching: ${search}` : "Discover Collection"}
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight">
            {search ? `Results for "${search}"` : "Our Collection"}
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
            {search
              ? `Showing matching pieces found in our current archives.`
              : "Curated silhouettes and premium pieces for the modern fashion enthusiast."}
          </p>
        </div>

        <div className="grid gap-3 sm:gap-6 lg:gap-10 grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <div className="col-span-full py-24 sm:py-32 text-center space-y-4">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                No pieces found matching your criteria.
              </p>
              <p className="text-sm text-slate-500">Try adjusting your search or browse our full collection.</p>
            </div>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </ResponsiveContainer>
    </div>
  );
}
