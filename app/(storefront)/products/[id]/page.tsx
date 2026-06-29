"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProductDetail } from "@/lib/api/catalog";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { ProductMediaGallery } from "@/components/storefront/ProductMediaGallery";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string>("");

  useEffect(() => {
    fetchProductDetail(id)
      .then((p) => {
        setProduct(p);
        // Pre-select first media item
        if (p?.media && p.media.length > 0) {
          setSelectedMediaId(p.media[0].id ?? "");
        }
      })
      .catch(() => setProduct(null));
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  // Helper to render design attributes in a clean inline list
  const attributes = [
    { label: "Material", value: product.material },
    { label: "Sleeve", value: product.sleeve },
    { label: "Neckline", value: product.neck_line },
    { label: "Length", value: product.length },
    { label: "Fit", value: product.fit },
  ].filter(attr => attr.value);

  return (
    <div className="bg-[#faf9f6] min-h-screen pb-16 sm:pb-32">
      <ResponsiveContainer className="py-8 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:gap-20 lg:grid-cols-12 lg:items-start">

          {/* LEFT: Media Gallery (5/12 columns) */}
          <div className="lg:col-span-6 xl:col-span-7">
            <ProductMediaGallery
              media={product.media || []}
              productName={product.name}
              onMediaSelect={(mediaId) => setSelectedMediaId(mediaId)}
            />
          </div>

          {/* RIGHT: Product Information (7/12 columns) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-full">
            <div className="flex-1 space-y-6">

              {/* Header: Name and Price (Bold Black) */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                  {product.name}
                </h1>
                <p className="text-2xl font-black text-slate-950">
                  Rs {product.base_price || (product as any).price || "0.00"}
                </p>
              </div>

              <div className="h-px w-full bg-slate-100" />

              {/* Description & Metadata with Stock Badge */}
              <div className="space-y-6">
                <p className="text-[15px] leading-relaxed text-slate-500 font-medium max-w-xl">
                  {product.description || "Designed for elegance and crafted with precision. This piece embodies the soul of modern boutique fashion."}
                </p>

                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-400">
                    Size: {product.variants?.map((v: any) => v.size).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).join(", ")}
                  </p>



                  {/* Delivery Signal: Processing Time */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                      {product.processing_days_max && product.processing_days_max > 0
                        ? `Usually dispatches in ${product.processing_days_min}-${product.processing_days_max} business days`
                        : "Ready for immediate dispatch"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100" />

              {/* Purchase Section */}
              <div className="pt-2">
                <AddToCartButton
                  variants={product.variants || []}
                  selectedMediaId={selectedMediaId}
                />
              </div>

              {/* Detailed Highlights Section at the Last */}
              {attributes.length > 0 && (
                <div className="space-y-8 pt-12 mt-12 border-t-2 border-slate-900/5">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-950">Product details</h2>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-lg font-black text-slate-950 flex items-center justify-between">
                      Top highlights
                      <span className="text-xl">˗</span>
                    </h3>

                    <div className="space-y-5">
                      {attributes.map((attr) => (
                        <div key={attr.label} className="grid grid-cols-[180px,1fr] gap-4 items-baseline">
                          <span className="text-[13px] font-black text-slate-950">{attr.label == "Neckline" ? "Neck style" : attr.label == "Fit" ? "Fit type" : attr.label == "Material" ? "Material composition" : attr.label == "Sleeve" ? "Sleeve type" : attr.label}</span>
                          <span className="text-sm text-slate-600 font-medium">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* trust signals further down */}
            <div className="grid grid-cols-2 gap-8 pt-12 mt-12 border-t border-slate-100">
              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg grayscale group-hover:grayscale-0 transition">✨</div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Handcrafted</p>
                  <p className="text-[9px] text-slate-400 font-medium">Premium Quality</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg grayscale group-hover:grayscale-0 transition">📦</div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Fast Delivery</p>
                  <p className="text-[9px] text-slate-400 font-medium">3-5 Business Days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
