"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { fetchBackofficeProducts } from "@/lib/api/catalog";
import { getProductImage, getMediaUrl } from "@/lib/utils";
import type { Product } from "@/types/product";
import { StatusBadge } from "@/components/backoffice/StatusBadge";
import { AlertBanner } from "@/components/ui/AlertBanner";

export default function ProductViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [fetching, setFetching] = useState(true);
    const [product, setProduct] = useState<Product | null>(null);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);

    const { token } = useAuth();

    useEffect(() => {
        if (!token) return;

        fetchBackofficeProducts(token)
            .then((data: any) => {
                const allProducts: Product[] = Array.isArray(data) ? data : data?.results || [];
                const found = allProducts.find(p => p.id === id) || null;
                if (found) {
                    setProduct(found);
                } else {
                    setErrorInfo("Product not found.");
                }
            })
            .catch(err => {
                console.error("Failed to load product:", err);
                setErrorInfo("Failed to load product details.");
            })
            .finally(() => setFetching(false));
    }, [id, token]);

    if (fetching) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-20 text-center">
                <h2 className="text-2xl font-black text-slate-900">Product Not Found</h2>
                <Link href="/backoffice/catalog">
                    <Button variant="outline" className="mt-6">Return to Catalog</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AlertBanner message={errorInfo || ""} onClose={() => setErrorInfo(null)} />

            {/* Header section */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                <div className="space-y-2">
                    <button
                        onClick={() => router.back()}
                        className="text-[10px] uppercase tracking-widest font-black text-slate-400 hover:text-slate-900 transition flex items-center gap-2 mb-4"
                    >
                        &larr; Back to Catalog
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black text-slate-900 leading-tight">{product.name}</h1>
                        <StatusBadge status={(product.variants?.length || 0) > 0 ? "active" : "draft"} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Link href={`/backoffice/catalog/${product.id}`}>
                        <Button variant="outline" className="px-8 py-4 text-[10px] uppercase tracking-widest font-black h-auto border-slate-200">
                            Edit Product
                        </Button>
                    </Link>
                    <Link href={`/products/${product.id}`} target="_blank">
                        <Button className="px-8 py-4 text-[10px] uppercase tracking-widest font-black h-auto">
                            Storefront View &rarr;
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-3">
                {/* Insights / Stats */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category</p>
                            <p className="text-xl font-black text-slate-900">{product.category_detail?.name || "Uncategorized"}</p>
                        </div>
                        <div className="rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pricing</p>
                            <p className="text-xl font-black text-slate-900">
                                NPR {product.base_price || (product as any).price || product.variants?.[0]?.price || "0.00"}
                            </p>
                        </div>
                        <div className="rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Variants</p>
                            <p className="text-xl font-black text-slate-900">{product.variants?.length || 0} Options</p>
                        </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Product Description</h3>
                        <p className="text-sm leading-8 text-slate-500 font-medium whitespace-pre-wrap">
                            {product.description || "No description provided for this item."}
                        </p>
                        <div className="pt-6 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">System SKU/Slug</p>
                                <p className="text-[11px] font-bold text-slate-900">{product.slug}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fulfillment (Processing)</p>
                                <p className="text-[11px] font-bold text-slate-900">
                                    {product.processing_days_min || 0} - {product.processing_days_max || 0} Days
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Product ID</p>
                                <p className="text-[11px] font-mono text-slate-500">{product.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Performance Insights</h3>
                        <div className="py-10 text-center space-y-4">
                            <div className="h-32 w-full flex items-end justify-center gap-2 px-10">
                                {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                                    <div key={i} className="flex-1 bg-slate-50 rounded-t-lg transition-all hover:bg-fuchsia-100" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Gathering sales data... (Coming Soon)</p>
                        </div>
                    </div>
                </div>

                {/* Media Sidebar */}
                <div className="space-y-10">
                    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Media Gallery</h3>
                        <div className="space-y-6">
                            <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-slate-50 border border-slate-100">
                                <img src={getProductImage(product)} alt="Main" className="h-full w-full object-cover" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {product.media?.slice(0, 4).map((m: any) => (
                                    <div key={m.id} className="aspect-square overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                                        <img src={getMediaUrl(m.file_url || m.file)} alt="Media" className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-slate-100 bg-slate-900 p-10 text-white space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Inventory Status</p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400">Total Purchase</span>
                                <span className="font-black">0 Items</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400">Page Views</span>
                                <span className="font-black">--</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400">Conversion</span>
                                <span className="font-black text-fuchsia-400">0.0%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
