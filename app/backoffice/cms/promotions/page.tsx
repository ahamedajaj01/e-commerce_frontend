"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficePromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    fetchBackofficeCollections
} from "@/lib/api/cms";
import { fetchBackofficeProducts, fetchBackofficeProductIds, fetchBackofficeCategories, fetchBackofficeBrands } from "@/lib/api/catalog";
import type { Promotion } from "@/types/cms";
import type { Product, Category, Brand } from "@/types/product";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Search, X, ShoppingBag, LayoutGrid, Check, Edit, ExternalLink, Filter, ChevronRight, ChevronLeft, Package, Tag, Layers, RefreshCw } from "lucide-react";
import { getProductImage } from "@/lib/utils";

export default function PromotionsPage() {
    const { token, isAuthenticated } = useAuth();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form Management
    const [showStudio, setShowStudio] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [targetCategoryId, setTargetCategoryId] = useState("");
    const [targetBrandId, setTargetBrandId] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Metadata
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [collections, setCollections] = useState<any[]>([]);

    // Product Picker State
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isProductLoading, setIsProductLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selCategory, setSelCategory] = useState("");
    const [selBrand, setSelBrand] = useState("");
    const [stockStatus, setStockStatus] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bootstrap Metadata
    useEffect(() => {
        if (!token) return;
        const init = async () => {
            try {
                const [promos, cats, brs, cols] = await Promise.all([
                    fetchBackofficePromotions(token),
                    fetchBackofficeCategories(token),
                    fetchBackofficeBrands(token),
                    fetchBackofficeCollections(token)
                ]);
                const systemTitles = ["New Arrivals", "Trending Now", "Best Sellers", "Homepage Selection"];
                setPromotions(promos.filter(p =>
                    !p.cta_link &&
                    !systemTitles.some(t => p.title.toLowerCase() === t.toLowerCase()) &&
                    p.description !== "Storefront Exclusive Collection"
                ));
                setCategories(cats);
                setBrands(brs);
                setCollections(cols);
            } catch (e) { setError("Studio initialization failed."); }
            finally { setIsLoading(false); }
        };
        init();
    }, [token]);

    // Async Product Linker (Fetching products matching selection)
    useEffect(() => {
        if (!token || !showStudio) return;
        const fetchItems = async () => {
            setIsProductLoading(true);
            try {
                const data = await fetchBackofficeProducts(token, {
                    page: currentPage,
                    page_size: 10,
                    search,
                    category: selCategory,
                    brand: selBrand,
                    stock_status: stockStatus
                });
                setAvailableProducts(data.results);
                setTotalProducts(data.count);
            } catch (e) { console.error(e); }
            finally { setIsProductLoading(false); }
        };
        fetchItems();
    }, [token, showStudio, currentPage, search, selCategory, selBrand, stockStatus]);

    const handleBulkSelect = async () => {
        if (!token) return;
        const ids = await fetchBackofficeProductIds(token, {
            search,
            category: selCategory,
            brand: selBrand,
            stock_status: stockStatus
        });
        setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
        setSuccess(`Bulk Added ${ids.length} products to campaign.`);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !title.trim()) return setError("Campaign title required");
        setIsSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", title);
            fd.append("description", description);
            fd.append("is_visible", "true");
            if (targetCategoryId) fd.append("category", targetCategoryId);
            if (targetBrandId) fd.append("brand", targetBrandId);
            if (imageFile) fd.append("image", imageFile);

            selectedIds.forEach(id => {
                fd.append("product_ids", id);
                fd.append("products", id);
            });

            if (editingId) await updatePromotion(editingId, fd, token);
            else await createPromotion(fd, token);

            setSuccess("Campaign Synced Successfully");
            setShowStudio(false);
            window.location.reload(); // Refresh to catch all changes
        } catch (err: any) { setError(err.message || "Save failed"); }
        finally { setIsSaving(false); }
    };

    const handleEdit = (p: Promotion) => {
        setEditingId(p.id);
        setTitle(p.title);
        setDescription(p.description || "");
        setTargetCategoryId(typeof p.category === 'object' ? (p.category as any)?.id : p.category || "");
        setTargetBrandId((p as any).brand || "");
        setSelectedIds(p.products?.map((prod: any) => prod.id) || []);
        setImagePreview(p.image || null);
        setShowStudio(true);
    };

    const resetStudio = () => {
        setEditingId(null); setTitle(""); setDescription(""); setTargetCategoryId(""); setTargetBrandId("");
        setSelectedIds([]); setImageFile(null); setImagePreview(null); setShowStudio(true);
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Loading Studio...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4">
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Premium Header */}
            <header className="flex items-center justify-between mb-10 bg-white/60 backdrop-blur-xl border border-white/40 p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/30">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl shadow-lg shadow-indigo-200 ring-4 ring-white">
                        <ShoppingBag className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Campaign Merchandising</h1>
                        <div className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-2">
                            Professional Studio <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" /> V3.2
                        </div>
                    </div>
                </div>
                <button
                    onClick={resetStudio}
                    className="group relative px-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl overflow-hidden shadow-slate-400 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                    <div className="relative z-10 flex items-center gap-3">
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" /> New Campaign
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </header>

            {/* Empty State */}
            {promotions.length === 0 && !showStudio && (
                <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-32 text-center transition-colors hover:border-indigo-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Tag className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">No Active Campaigns</h3>
                    <p className="text-slate-400 text-sm font-bold mt-3 max-w-sm mx-auto">Create time-limited collections or category-wide sales using the Campaign Studio.</p>
                </div>
            )}

            {/* Campaign Grid */}
            {!showStudio && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    {promotions.map(promo => (
                        <div key={promo.id} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                            <div className="aspect-[16/9] bg-slate-100 relative group-hover:scale-105 transition-transform duration-700">
                                {promo.image ? (
                                    <img src={promo.image} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Layers className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-6 left-6 flex gap-2">
                                    <div className="px-5 py-2 bg-white/90 backdrop-blur rounded-full shadow-lg border border-white">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900">
                                            {promo.products?.length || 0} Items
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2 uppercase">{promo.title}</h3>
                                <p className="text-sm text-slate-400 font-bold line-clamp-2 min-h-[2.5rem]">{promo.description || "Active Storefront Campaign"}</p>
                                <div className="mt-8 flex items-center justify-between gap-4">
                                    <button
                                        onClick={() => handleEdit(promo)}
                                        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { if (confirm("Terminate Campaign?")) deletePromotion(promo.id, token!).then(() => window.location.reload()) }}
                                        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <Link
                                        href={`/collections/${promo.id}`}
                                        className="flex-1 h-12 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-slate-800 transition-all group"
                                    >
                                        View Live <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SALE CAMPAIGN STUDIO OVERLAY */}
            {showStudio && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-50/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="flex h-full">
                        {/* Sidebar: Campaign Settings */}
                        <div className="w-[450px] bg-white border-r border-slate-200 h-full flex flex-col p-12 shadow-2xl animate-in slide-in-from-left duration-500">
                            <div className="flex items-center gap-4 mb-12">
                                <button onClick={() => setShowStudio(false)} className="p-3 rounded-2xl hover:bg-slate-100 transition active:scale-95">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Campaign Studio</h2>
                            </div>

                            <form className="flex-1 overflow-y-auto pr-4 no-scrollbar space-y-10" id="campaign-form">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Campaign Title</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Summer Collection 24" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-black focus:ring-4 focus:ring-indigo-50 transition-all outline-none" />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Hero Graphics</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-[21/9] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden cursor-pointer flex flex-col items-center justify-center gap-4 group hover:border-indigo-300 transition-all"
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                                        ) : (
                                            <>
                                                <div className="p-3 bg-white rounded-xl shadow-sm"><Plus className="w-5 h-5 text-slate-400" /></div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Banner</p>
                                            </>
                                        )}
                                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                                        }} />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 space-y-8">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500">Targeting Strategy</h3>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                            <Tag className="w-3 h-3" /> Auto-Target Category
                                        </label>
                                        <select value={targetCategoryId} onChange={e => setTargetCategoryId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-black focus:ring-4 focus:ring-indigo-50 transition-all outline-none">
                                            <option value="">Manual Selection Only</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                            <Package className="w-3 h-3" /> Auto-Target Brand
                                        </label>
                                        <select value={targetBrandId} onChange={e => setTargetBrandId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-black focus:ring-4 focus:ring-indigo-50 transition-all outline-none">
                                            <option value="">Manual Selection Only</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </form>

                            <div className="pt-10 border-t border-slate-100 mt-auto flex gap-4">
                                <button disabled={isSaving} onClick={handleSave} className="flex-1 py-5 bg-slate-950 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all">
                                    {isSaving ? "Syncing..." : (editingId ? "Update Campaign" : "Launch Campaign")}
                                </button>
                            </div>
                        </div>

                        {/* Main Studio: High-Scale Product Picker */}
                        <main className="flex-1 overflow-hidden flex flex-col p-12 space-y-10 animate-in slide-in-from-right duration-700">
                            <header className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Product Merchandising</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-1">Curate specific highlights for your campaign storefront</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-6 py-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{selectedIds.length} Selections Locked</span>
                                    </div>
                                    <button onClick={() => setSelectedIds([])} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 shadow-sm">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </header>

                            {/* Selection Preview Deck */}
                            {selectedIds.length > 0 && (
                                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar animate-in fade-in zoom-in-95">
                                    {selectedIds.slice(0, 15).map(id => {
                                        const p = availableProducts.find(pr => pr.id === id);
                                        return (
                                            <div key={id} className="relative group shrink-0">
                                                <div className="w-16 h-16 bg-white border-2 border-white rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-100">
                                                    {p?.media?.[0]?.file_url && <img src={p.media[0].file_url} className="w-full h-full object-cover" crossOrigin="anonymous" />}
                                                </div>
                                                <button onClick={() => setSelectedIds(s => s.filter(i => i !== id))} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {selectedIds.length > 15 && (
                                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-[10px] font-black text-white shadow-xl ring-4 ring-white">
                                            +{selectedIds.length - 15}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Heavy Filter Bar */}
                            <div className="bg-white/50 border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                                <div className="grid grid-cols-12 gap-6 items-center">
                                    <div className="col-span-4 relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Search Name, SKU, Brand..."
                                            className="w-full bg-white border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <select value={selCategory} onChange={e => setSelCategory(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest outline-none">
                                            <option value="">Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <select value={selBrand} onChange={e => setSelBrand(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest outline-none">
                                            <option value="">Brand</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <select value={stockStatus} onChange={e => setStockStatus(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest outline-none">
                                            <option value="">Stock Status</option>
                                            <option value="in_stock">In Stock</option>
                                            <option value="out_of_stock">Out of Stock</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <button onClick={handleBulkSelect} className="w-full h-full py-4 bg-indigo-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95">
                                            Bulk Add Results
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Massive Product Grid */}
                            <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                    {isProductLoading ? (
                                        <div className="h-full flex items-center justify-center"><RefreshCw className="w-10 h-10 animate-spin text-slate-100" /></div>
                                    ) : (
                                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 p-8 gap-8">
                                            {availableProducts.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id])}
                                                    className={cn(
                                                        "group relative bg-slate-50 rounded-3xl border-2 transition-all duration-300 cursor-pointer overflow-hidden aspect-[4/5]",
                                                        selectedIds.includes(p.id) ? "border-indigo-500 ring-4 ring-indigo-50 bg-indigo-50/50 scale-[0.98]" : "border-transparent hover:border-slate-200 hover:bg-white hover:shadow-xl hover:-translate-y-1"
                                                    )}
                                                >
                                                    <img src={p.media?.[0]?.file_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" crossOrigin="anonymous" />
                                                    {selectedIds.includes(p.id) && (
                                                        <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-[2px] flex items-center justify-center animate-in zoom-in-75">
                                                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-xl"><Check className="w-5 h-5 text-indigo-600" /></div>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform">
                                                        <p className="text-white text-[10px] font-black truncate uppercase tracking-widest">{p.name}</p>
                                                        <p className="text-white/60 text-[9px] font-bold mt-1">₹{p.base_price}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Studio Pagination */}
                                <footer className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalProducts)} of {totalProducts} Master Catalog items
                                    </div>
                                    <div className="flex gap-4">
                                        <button disabled={currentPage <= 1} onClick={() => setCurrentPage(c => c - 1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronLeft /></button>
                                        <button disabled={currentPage * 10 >= totalProducts} onClick={() => setCurrentPage(c => c + 1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronRight /></button>
                                    </div>
                                </footer>
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
}
