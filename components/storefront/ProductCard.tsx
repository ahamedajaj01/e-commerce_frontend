"use client";

import type { ProductSummary } from "@/types/product";
import { useCart } from "@/hooks/useCart";
import { getProductImage } from "@/lib/utils";

import Link from "next/link";

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getProductImage(product);
  const detailPath = `/products/${product.slug || product.id}`;

  return (
    <Link href={detailPath} className="group block w-full relative">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50 rounded-lg sm:rounded-none">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-slate-100 flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-400">No Image</span>
          </div>
        )}

        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/5" />

        {product.badge && (
          <span className="absolute left-2 top-2 sm:left-4 sm:top-4 bg-slate-900 px-2 py-1 sm:px-3 sm:py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">
            {product.badge}
          </span>
        )}
      </div>

      <div className="pt-3 sm:pt-5 flex flex-col items-center text-center space-y-1 sm:space-y-1.5">
        <h3 className="text-[11px] sm:text-sm font-black text-slate-900 uppercase tracking-wide truncate w-full px-1 sm:px-2">
          {product.name}
        </h3>
        <p className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-widest text-slate-400">
          Rs. {product.base_price || (product as any).price || product.variants?.[0]?.price || "0.00"}
        </p>
      </div>
    </Link>
  );
}
