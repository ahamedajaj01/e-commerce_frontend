"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficePromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
} from "@/lib/api/cms";
import { fetchBackofficeProducts, fetchBackofficeCategories } from "@/lib/api/catalog";
import type { Promotion } from "@/types/cms";
import type { Product, Category } from "@/types/product";
import { AlertBanner } from "@/components/ui/AlertBanner";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Search, X, ShoppingBag, LayoutGrid, Check, Edit, ExternalLink } from "lucide-react";
import { getProductImage } from "@/lib/utils";

export default function PromotionsPage() {
    const { token, isAuthenticated } = useAuth();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Advanced Merchandising State
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [promoData, prodData, catData] = await Promise.all([
                fetchBackofficePromotions(token),
                fetchBackofficeProducts(token),
                fetchBackofficeCategories(token)
            ]);
            const prArr = Array.isArray(promoData) ? promoData : (promoData as any)?.results || [];

            // Filter out Visual Banners (which have cta_link/cta_text) and Announcements (no image, no products)
            const saleCampaigns = prArr.filter((p: any) =>
                !p.cta_link &&
                p.title !== "Homepage Selection"
            );
            setPromotions(saleCampaigns);

            const pArr = Array.isArray(prodData) ? prodData : (prodData as any)?.results || [];
            setProducts(pArr);
            const cArr = Array.isArray(catData) ? catData : (catData as any)?.results || [];
            setCategories(cArr);
        } catch (err: any) {
            setError("Failed to load promotions data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) load();
    }, [token, isAuthenticated]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node))
                setShowProductDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
        !selectedProductIds.includes(p.id)
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !title.trim()) { setError("Title is required"); return; }
        setIsSaving(true);
        try {
            const payload = new FormData();
            payload.append("title", title.trim());
            payload.append("description", description);
            payload.append("is_visible", "true");

            selectedProductIds.forEach(id => {
                payload.append("product_ids", id);
                payload.append("products", id);
            });

            if (categoryId) payload.append("category", categoryId);
            if (imageFile) payload.append("image", imageFile);

            if (editingId) {
                await updatePromotion(editingId, payload, token);
                setSuccess("Sale Campaign Updated!");
            } else {
                await createPromotion(payload, token);
                setSuccess("Sale Campaign Created!");
            }

            setShowForm(false);
            setEditingId(null);
            setTitle(""); setDescription(""); setSelectedProductIds([]);
            setCategoryId(""); setImageFile(null); setImagePreview(null);
            load();
        } catch (err: any) {
            setError(err.message || "Failed to save promotion.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (promo: Promotion) => {
        setEditingId(promo.id);
        setTitle(promo.title);
        setDescription(promo.description || "");
        setSelectedProductIds(promo.products?.map((p: any) => p.id) || []);
        setCategoryId(typeof (promo as any).category === 'object' ? (promo as any).category?.id || "" : (promo as any).category || "");
        setImagePreview(promo.image || null);
        setImageFile(null);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!token || !confirm("Delete this campaign?")) return;
        try {
            await deletePromotion(id, token);
            setSuccess("Campaign Deleted.");
            load();
        } catch { setError("Failed to delete."); }
    };

    const toggleProduct = (productId: string) => {
        if (selectedProductIds.includes(productId)) {
            setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
        } else {
            setSelectedProductIds([...selectedProductIds, productId]);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <Link href="/backoffice/dashboard" className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                        <ShoppingBag className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Sale Campaigns</h1>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Group products for special discounts and landing pages</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setTitle("");
                        setDescription("");
                        setSelectedProductIds([]);
                        setCategoryId("");
                        setImagePreview(null);
                        setImageFile(null);
                        setShowForm(true);
                    }}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition"
                >
                    + Create Sale
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden font-sans">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                    </div>
                ) : promotions.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LayoutGrid className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Executive Dashboard Empty</h3>
                        <p className="text-sm text-slate-400 font-medium mt-2 max-w-sm mx-auto">No campaigns are currently active. Initialize your first sale to begin storefront merchandising.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-10 py-5 bg-slate-50/50 items-center border-b border-slate-100">
                            <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Campaign Profile</div>
                            <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Visibility</div>
                            <div className="col-span-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Catalog Data</div>
                            <div className="col-span-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Operations</div>
                        </div>

                        {promotions.map(promo => (
                            <div key={promo.id} className="grid grid-cols-12 gap-4 px-10 py-8 items-center hover:bg-slate-50/30 transition-all duration-300 group">
                                <div className="col-span-4">
                                    <div className="flex items-center gap-5">
                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm transition-transform group-hover:scale-105 group-hover:border-indigo-200 group-hover:bg-indigo-50/30">
                                            <ShoppingBag className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight truncate">{promo.title}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {promo.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 flex justify-center">
                                    {promo.is_visible ? (
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-400 rounded-full border border-slate-200/50">
                                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Draft</span>
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-3 flex items-center justify-center gap-4 border-l border-r border-slate-50">
                                    <div className="flex -space-x-2.5">
                                        {promo.products?.slice(0, 3).map((p: any) => {
                                            const img = getProductImage(p);
                                            return (
                                                <div key={p.id} className="h-8 w-8 rounded-xl bg-white border-2 border-white ring-1 ring-slate-100 overflow-hidden shadow-sm transition-transform group-hover:translate-y-[-2px]">
                                                    {img ? (
                                                        <img src={img} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[8px] text-slate-300 font-black">?</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(promo.products?.length || 0) > 3 && (
                                            <div className="h-8 w-8 rounded-xl bg-slate-900 border-2 border-white flex items-center justify-center text-[7px] font-black text-white shadow-sm">
                                                +{(promo.products?.length || 0) - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-900 leading-none">{promo.products?.length || 0}</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 text-center">Items</span>
                                    </div>
                                </div>

                                <div className="col-span-3 flex items-center justify-end gap-2">
                                    <Link
                                        href={`/backoffice/cms/promotions/${promo.id}`}
                                        className="h-10 px-5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.1em] hover:bg-slate-800 transition flex items-center gap-2 shadow-lg shadow-slate-100"
                                    >
                                        Open <ExternalLink className="w-3 h-3" />
                                    </Link>
                                    <button
                                        onClick={() => handleEdit(promo)}
                                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(promo.id)}
                                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Form Modal */}
            {
                showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">{editingId ? "Edit Custom Collection" : "New Custom Collection"}</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1">{editingId ? "Update your promotional grouping" : "Configure a new dynamic collection"}</p>
                                </div>
                                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-3 rounded-full hover:bg-white text-slate-400 transition hover:shadow-sm"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Campaign Title *</label>
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Dashain Festival Sale"
                                            className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description (Internal)</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe the goal of this sale..."
                                            rows={3}
                                            className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dynamic Engine (Optional)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sync Entire Category</label>
                                            <select
                                                value={categoryId}
                                                onChange={e => setCategoryId(e.target.value)}
                                                className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                                            >
                                                <option value="">No Category Selected</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Collection Hero Banner</label>
                                            <div className="flex items-center gap-3">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                    {imagePreview ? "Change Banner" : "Upload Banner"}
                                                </button>
                                                {imagePreview && (
                                                    <div className="h-10 w-16 rounded overflow-hidden border">
                                                        <img src={imagePreview} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={e => {
                                                    const f = e.target.files?.[0];
                                                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Products in this Sale</label>
                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">{selectedProductIds.length} Selected</span>
                                    </div>

                                    <div className="space-y-4" ref={searchRef}>
                                        <div className="relative">
                                            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                                                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <input
                                                    value={productSearch}
                                                    onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                                                    onFocus={() => setShowProductDropdown(true)}
                                                    placeholder="Search and select products..."
                                                    className="flex-1 py-4 bg-transparent text-sm font-bold focus:outline-none"
                                                />
                                                <Plus className="w-4 h-4 text-slate-300 ml-2 cursor-pointer hover:text-indigo-500 transition" />
                                            </div>

                                            {showProductDropdown && productSearch && (
                                                <div className="absolute z-[60] mt-3 w-full bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                                    {filteredProducts.length === 0 ? (
                                                        <p className="px-6 py-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">No matching products</p>
                                                    ) : (
                                                        filteredProducts.slice(0, 10).map(p => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => { toggleProduct(p.id); setProductSearch(""); setShowProductDropdown(false); }}
                                                                className="w-full px-6 py-4 text-left hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                                                                        {p.media?.[0]?.file_url && <img src={p.media[0].file_url} className="w-full h-full object-cover" />}
                                                                    </div>
                                                                    <p className="text-sm font-black text-slate-900">{p.name}</p>
                                                                </div>
                                                                <Plus className="w-4 h-4 text-slate-300" />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Products Grid */}
                                        <div className="grid gap-3 pt-2">
                                            {selectedProductIds.map(id => {
                                                const p = products.find(prod => prod.id === id);
                                                if (!p) return null;
                                                return (
                                                    <div key={id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 overflow-hidden">
                                                                {p.media?.[0]?.file_url && <img src={p.media[0].file_url} className="w-full h-full object-cover" />}
                                                            </div>
                                                            <p className="text-sm font-black text-slate-900">{p.name}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleProduct(id)}
                                                            className="p-2 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 text-sm font-black hover:bg-white hover:shadow-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white text-sm font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : (editingId ? "Update Campaign →" : "Save Campaign →")}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
