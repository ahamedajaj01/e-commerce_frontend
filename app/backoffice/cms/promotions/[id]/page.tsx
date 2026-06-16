"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficePromotions,
    updatePromotion
} from "@/lib/api/cms";
import { fetchBackofficeProducts } from "@/lib/api/catalog";
import type { Promotion } from "@/types/cms";
import type { Product } from "@/types/product";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import Link from "next/link";
import {
    ArrowLeft, Search, X, Plus, Trash2,
    ShoppingBag, Tag, LayoutGrid, CheckCircle2,
    Calendar, MoreVertical, ExternalLink
} from "lucide-react";
import { getProductImage } from "@/lib/utils";

export default function PromotionDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuth();
    const { confirm } = useModal();

    const [promotion, setPromotion] = useState<Promotion | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const load = async () => {
        if (!token || !id) return;
        setIsLoading(true);
        try {
            const [promos, products] = await Promise.all([
                fetchBackofficePromotions(token),
                fetchBackofficeProducts(token)
            ]);

            const promoList = Array.isArray(promos) ? promos : (promos as any).results || [];
            const current = promoList.find((p: any) => p.id === id);

            if (!current) {
                router.push("/backoffice/cms/promotions");
                return;
            }

            setPromotion(current);
            setAllProducts(Array.isArray(products) ? products : (products as any).results || []);
        } catch (err) {
            setError("Failed to load project details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) load();
    }, [token, isAuthenticated, id]);

    // Close dropdown on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleAddProduct = async (productId: string) => {
        if (!token || !promotion) return;

        const currentIds = promotion.products?.map((p: any) => p.id) || [];
        if (currentIds.includes(productId)) return;

        setIsSaving(true);
        try {
            const newIds = [...currentIds, productId];
            await updatePromotion(promotion.id, { product_ids: newIds }, token);
            setSuccess("Product added to campaign.");
            setSearchQuery("");
            setShowDropdown(false);
            load();
        } catch {
            setError("Could not add product.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveProduct = (productId: string) => {
        if (!token || !promotion) return;

        confirm({
            title: "Remove Product?",
            description: "Are you sure you want to remove this product from the campaign collection? This will immediately hide it from the campaign landing page.",
            confirmText: "Remove",
            variant: "danger",
            onConfirm: async () => {
                setIsSaving(true);
                try {
                    const currentIds = promotion.products?.map((p: any) => p.id) || [];
                    const newIds = currentIds.filter(id => id !== productId);
                    await updatePromotion(promotion.id, { product_ids: newIds }, token);
                    setSuccess("Product removed.");
                    load();
                } catch {
                    setError("Could not remove product.");
                } finally {
                    setIsSaving(false);
                }
            }
        });
    };

    const filteredSuggestions = allProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !promotion?.products?.some((sp: any) => sp.id === p.id)
    ).slice(0, 5);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            </div>
        );
    }

    if (!promotion) return null;

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 font-sans">
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-7">
                    <Link href="/backoffice/cms/promotions" className="p-4 rounded-3xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition border border-slate-100 shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg">
                                <ShoppingBag className="w-3 h-3 text-indigo-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600">Enterprise Merchandising</span>
                            </div>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Workspace / {promotion.id.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{promotion.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${promotion.is_visible ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{promotion.is_visible ? 'Live' : 'Draft'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* Left: Product List Management */}
                <div className="col-span-8 space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden min-h-[600px] flex flex-col">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Inventory</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">Manage product priority and visibility within this bundle.</p>
                            </div>

                            {/* Search & Add */}
                            <div className="relative w-80" ref={searchRef}>
                                <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-[1.5rem] px-5 py-3.5 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all shadow-sm">
                                    <Search className="w-4 h-4 text-slate-400" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder="Quick Search Product..."
                                        className="bg-transparent text-xs font-bold focus:outline-none w-full placeholder:text-slate-300"
                                    />
                                </div>

                                {showDropdown && searchQuery && (
                                    <div className="absolute z-50 mt-4 w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                        {filteredSuggestions.length === 0 ? (
                                            <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching assets</div>
                                        ) : (
                                            filteredSuggestions.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleAddProduct(p.id)}
                                                    className="w-full px-6 py-5 text-left hover:bg-slate-50 flex items-center gap-5 transition-all border-b border-slate-50 last:border-0"
                                                >
                                                    <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                                                        {getProductImage(p) ? <img src={getProductImage(p)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{p.name}</p>
                                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">NPR {p.base_price}</p>
                                                    </div>
                                                    <Plus className="w-4 h-4 text-slate-200 group-hover:text-indigo-500" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 divide-y divide-slate-100">
                            {(!promotion.products || promotion.products.length === 0) ? (
                                <div className="p-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ShoppingBag className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <p className="text-base font-black text-slate-900 uppercase tracking-tight">Campaign Inventory Empty</p>
                                    <p className="text-xs text-slate-400 mt-2 font-medium">Link products to populate the <b>{promotion.title}</b> landing page.</p>
                                </div>
                            ) : (
                                promotion.products.map((p: any) => (
                                    <div key={p.id} className="p-8 flex items-center gap-8 hover:bg-slate-50/50 transition-all duration-300 group">
                                        <div className="h-16 w-16 rounded-[1.5rem] bg-white border border-slate-200 overflow-hidden shadow-md flex-shrink-0 transition-transform group-hover:scale-105">
                                            {getProductImage(p) ? <img src={getProductImage(p)} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full bg-slate-50" />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">{p.name}</h4>
                                                <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">#{p.id.slice(0, 4)}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/80 px-3 py-1 rounded-lg uppercase tracking-widest">NPR {p.base_price}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <Tag className="w-3.5 h-3.5" /> {p.category?.name || "Premium Storefront"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleRemoveProduct(p.id)}
                                                className="p-4 text-slate-300 hover:text-rose-500 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Insights & Metadata */}
                <div className="col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden ring-1 ring-white/10">
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <LayoutGrid className="w-40 h-40 rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-8 border-b border-white/10 pb-4">Executive Analytics</h3>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex items-end gap-3">
                                        <p className="text-5xl font-black tracking-tighter leading-none">{promotion.products?.length || 0}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Products</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Active in current collection</p>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center justify-between bg-white/5 py-4 px-6 rounded-2xl border border-white/5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Store Live</span>
                                        <span className="text-xs font-black text-emerald-400 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ON PUBLIC STORE
                                        </span>
                                    </div>
                                    <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-900/40 border border-white/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Tag className="w-4 h-4 opacity-60" />
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80 uppercase">Campaign Link</span>
                                        </div>
                                        <p className="text-[9px] font-bold opacity-60 break-all bg-black/20 p-2 rounded-lg">/promotions/{promotion.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 space-y-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Merchandising Guide</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex gap-5">
                                <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-[11px] font-black border border-indigo-100">01</div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Ensure promotional titles are high-impact. This title is displayed as the primary heading on the landing page.
                                </p>
                            </div>
                            <div className="flex gap-5">
                                <div className="h-7 w-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 text-[11px] font-black border border-slate-100">02</div>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                                    System automatically optimizes images for high-DPI displays. Ensure master images are at least 1200px wide.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
