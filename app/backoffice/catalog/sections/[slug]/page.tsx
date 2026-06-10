"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchBackofficeProducts } from "@/lib/api/catalog";
import {
    fetchBackofficePromotions,
    updatePromotion,
    createPromotion,
    deletePromotion
} from "@/lib/api/cms";
import { Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import type { Promotion } from "@/types/cms";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { getProductImage, getMediaUrl } from "@/lib/utils";
import type { Category } from "@/types/product";
import { fetchBackofficeCategories } from "@/lib/api/catalog";
import Link from "next/link";
import {
    ArrowLeft, Search, Plus, X,
    Layers, ShoppingBag, CheckCircle,
    TrendingUp, Star, Clock, Home, Image as ImageIcon, Save,
    ChevronLeft, ChevronRight
} from "lucide-react";

function CatalogSectionContent({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
    const params = React.use(paramsPromise);
    const slug = params.slug;
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetId = searchParams.get("id");
    const { token, isAuthenticated } = useAuth();

    const [products, setProducts] = useState<Product[]>([]);
    const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // New Content Architecture State
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const sectionInfo = {
        "new-arrivals": { title: "New Arrivals", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50" },
        "trending": { title: "Trending Now", icon: TrendingUp, color: "text-fuchsia-500", bg: "bg-fuchsia-50" },
        "best-sellers": { title: "Best Sellers", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
        "homepage": { title: "Homepage Selection", icon: Home, color: "text-indigo-500", bg: "bg-indigo-50" },
        "exclusive-collection": { title: "Create Custom Collection", icon: Layers, color: "text-purple-500", bg: "bg-purple-50" },
    }[slug] || { title: "Catalog Section", icon: Layers, color: "text-slate-500", bg: "bg-slate-50" };

    // Archive Pagination
    const [archivePage, setArchivePage] = useState(1);
    const [archiveTotal, setArchiveTotal] = useState(0);
    const ARCHIVE_SIZE = 25;
    const archiveTotalPages = Math.ceil(archiveTotal / ARCHIVE_SIZE);

    const loadData = useCallback(async (targetId?: string) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [promoData, prodRes, catData] = await Promise.all([
                fetchBackofficePromotions(token),
                fetchBackofficeProducts(token, archivePage),
                fetchBackofficeCategories(token)
            ]);

            const promos = Array.isArray(promoData) ? promoData : (promoData as any)?.results || [];
            const allProducts = prodRes.results;
            setArchiveTotal(prodRes.count);
            const catResults = Array.isArray(catData) ? catData : (catData as any)?.results || [];

            setProducts(allProducts);
            setCategories(catResults);
            setAllPromotions(promos);

            const target = targetId
                ? promos.find((p: Promotion) => p.id === targetId)
                : (slug === "exclusive-collection" ? null : promos.find((p: Promotion) =>
                    p.title.toLowerCase().replace(/\s+/g, '-') === slug ||
                    (p as any).slug === slug ||
                    p.title === sectionInfo.title
                ));

            if (target) {
                setCurrentPromotion(target);
                const assignedIds = target.products?.map((p: any) => typeof p === 'string' ? p : p.id)
                    || target.product_ids
                    || [];
                setSelectedIds(assignedIds);
                if (target.image) setImagePreview(target.image);
                if ((target as any).category) {
                    setSelectedCategory(typeof (target as any).category === 'object' ? (target as any).category.id : (target as any).category);
                }
                if (slug === "exclusive-collection" && target.title) setSearchQuery(target.title);
            }
        } catch (err) {
            setError("Session connection unstable. Retrying...");
        } finally {
            setIsLoading(false);
        }
    }, [token, slug, sectionInfo.title, archivePage]);

    useEffect(() => {
        if (isAuthenticated && token) loadData();
    }, [token, isAuthenticated, loadData]);

    const performAutoSave = async (newIds: string[], newCategory = selectedCategory, newImage = imageFile) => {
        if (!token) return;
        setIsSaving(true);
        try {
            const finalTitle = currentPromotion?.title || (slug === "exclusive-collection" ? (searchQuery || "Exclusive Collection") : sectionInfo.title);
            const descriptionValue = slug === "exclusive-collection" ? "Storefront Exclusive Collection" : `System Managed: ${slug}`;

            let updated;

            // Fix: Use JSON instead of FormData when no image is present to properly handle empty arrays
            if (!newImage) {
                const jsonPayload = {
                    title: finalTitle,
                    description: descriptionValue,
                    is_visible: true,
                    is_active: true,
                    product_ids: newIds,
                    products: newIds,
                    category: newCategory || null
                };

                if (currentPromotion) {
                    updated = await updatePromotion(currentPromotion.id, jsonPayload, token);
                } else {
                    updated = await createPromotion(jsonPayload, token);
                }
            } else {
                // Use FormData for image uploads
                const payload = new FormData();
                payload.append("title", finalTitle);
                payload.append("description", descriptionValue);
                payload.append("is_visible", "true");
                payload.append("is_active", "true");

                newIds.forEach(id => {
                    payload.append("product_ids", id);
                    payload.append("products", id);
                });

                if (newCategory) payload.append("category", newCategory);
                payload.append("image", newImage);

                if (currentPromotion) {
                    updated = await updatePromotion(currentPromotion.id, payload, token);
                } else {
                    updated = await createPromotion(payload, token);
                }
            }

            const oldImage = currentPromotion?.image;
            setCurrentPromotion(updated);

            // Sync the preview while respecting manual overrides
            if (updated.image && !newImage && oldImage) {
                setImagePreview(oldImage);
            } else if (updated.image) {
                setImagePreview(updated.image);
            }

            if (slug === "exclusive-collection") {
                setSuccess("Collection Published Successfully!");
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError("Failed to save changes. Verify your connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!token || !window.confirm("Are you sure you want to permanently delete this collection?")) return;
        try {
            await deletePromotion(id, token);
            setSuccess("Collection removed from archives.");
            if (currentPromotion?.id === id) {
                setCurrentPromotion(null);
                setIsDashboard(true);
            }
            loadData();
        } catch (err) {
            setError("Failed to delete. Please try again.");
        }
    };

    const toggleProduct = (id: string) => {
        const isSelected = selectedIds.includes(id);
        const nextIds = isSelected
            ? selectedIds.filter(i => i !== id)
            : [...selectedIds, id];

        // Only local state update, no auto-save
        setSelectedIds(nextIds);
    };

    const filteredCatalog = products.filter(p =>
        p.name.toLowerCase().includes(archiveSearchQuery.toLowerCase()) && !selectedIds.includes(p.id)
    );

    const selectedProducts = products.filter(p => selectedIds.includes(p.id));

    const Icon = sectionInfo.icon;

    const [showModal, setShowModal] = useState(false);
    const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
    const [isDashboard, setIsDashboard] = useState(slug === "exclusive-collection" && !targetId);

    useEffect(() => {
        if (slug === "exclusive-collection" && currentPromotion) {
            setIsDashboard(false);
        } else if (slug === "exclusive-collection" && !currentPromotion) {
            setIsDashboard(true);
        }
    }, [slug, currentPromotion]);

    const enterManagement = (p: Promotion) => {
        setCurrentPromotion(p);
        const assignedIds = p.products?.map((item: any) => typeof item === 'string' ? item : item.id)
            || p.product_ids
            || [];
        setSelectedIds(assignedIds);
        setImagePreview(p.image || null);
        if ((p as any).category) {
            setSelectedCategory(typeof (p as any).category === 'object' ? (p as any).category.id : (p as any).category);
        }
        setSearchQuery("");
        setIsDashboard(false);
        router.push(`?id=${p.id}`, { scroll: false });
    };

    // CUSTOM UI DASHBOARD (List of all custom collections)
    if (slug === "exclusive-collection" && isDashboard) {
        const customCollectionsList = allPromotions.filter(p => p.description === "Storefront Exclusive Collection");

        return (
            <div className="space-y-10 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto">
                <AlertBanner message={error || ""} onClose={() => setError(null)} type="error" />
                {success && <AlertBanner message={success} onClose={() => setSuccess(null)} type="success" />}

                <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exclusive Collections</h1>
                        <p className="text-sm font-medium text-slate-400 mt-2 max-w-lg">Manage dynamic homepage blocks and banners.</p>
                    </div>
                    <button onClick={() => { setSearchQuery(""); setImagePreview(null); setImageFile(null); setShowModal(true); }} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition">
                        + New Collection
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[3rem] p-4 min-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[350px]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" /></div>
                    ) : customCollectionsList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-12 h-[350px]">
                            <Layers className="w-16 h-16 text-slate-100 mb-6" />
                            <h3 className="text-xl font-black text-slate-900 uppercase">No Collections</h3>
                            <button onClick={() => setShowModal(true)} className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Create One</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                            {customCollectionsList.map(collection => (
                                <div key={collection.id} onClick={() => enterManagement(collection)} className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
                                    <div className="aspect-[4/3] bg-white w-full relative">
                                        {collection.image ? (
                                            <img src={collection.image.startsWith('http') ? collection.image : getMediaUrl(collection.image)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Banner" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                                        <div className="absolute bottom-6 left-6 right-6">
                                            <h3 className="text-xl font-black text-white truncate">{collection.title}</h3>
                                            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-1 uppercase">Manage products & banner</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900">New Collection</h3>
                                <button onClick={() => setShowModal(false)}><X /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Collection Name" className="w-full rounded-2xl bg-slate-50 border p-4 font-bold" />
                                <div className="flex items-center gap-4">
                                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black">Upload Banner</button>
                                    {imagePreview && <img src={imagePreview} className="h-12 w-16 object-cover rounded-lg" />}
                                    <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                                    }} />
                                </div>
                            </div>
                            <div className="p-8 border-t flex gap-4">
                                <button onClick={async () => {
                                    const payload = new FormData();
                                    payload.append("title", searchQuery);
                                    payload.append("description", "Storefront Exclusive Collection");
                                    payload.append("is_visible", "true");
                                    if (imageFile) payload.append("image", imageFile);
                                    await createPromotion(payload, token!);
                                    setShowModal(false); loadData();
                                }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">Create Collection</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Conditional Dashboard View for Exclusive Collections */}
            {slug === "exclusive-collection" && isDashboard && (
                <div className="space-y-10">
                    {/* Header block with Create button */}
                    <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exclusive Collections</h1>
                            <p className="text-sm font-medium text-slate-400 mt-2 max-w-lg">
                                Manage your dynamic exclusive collections and banners for the Storefront UI.
                            </p>
                        </div>
                        <button onClick={() => { setSearchQuery(""); setImagePreview(null); setImageFile(null); setShowModal(true); }} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-indigo-100">
                            + Create Collection
                        </button>
                    </div>

                    {/* Dashboard List View */}
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-4 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-[350px]">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
                            </div>
                        ) : allPromotions.filter(p => p.description === "Storefront Exclusive Collection").length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center p-12 h-[350px]">
                                <Layers className="w-16 h-16 text-slate-100 mb-6" />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Collections Yet</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mb-6">Create your first collection to showcase on the storefront grid.</p>
                                <button onClick={() => { setSearchQuery(""); setImagePreview(null); setImageFile(null); setShowModal(true); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition">
                                    Create Collection
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                                {allPromotions.filter(p => p.description === "Storefront Exclusive Collection").map(collection => (
                                    <div key={collection.id} onClick={() => enterManagement(collection)} className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
                                        <div className="aspect-[4/3] bg-white w-full relative">
                                            {collection.image ? (
                                                <img src={collection.image.startsWith('http') ? collection.image : getMediaUrl(collection.image)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Banner" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                    <ImageIcon className="w-8 h-8 mb-2" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">No Banner</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                                            <div className="absolute bottom-6 left-6 right-6">
                                                <h3 className="text-xl font-black text-white truncate">{collection.title}</h3>
                                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-1">Manage Products & Banner</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(collection.id); }}
                                                className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h3 className="text-xl font-black text-slate-900">New Exclusive Collection</h3>
                                    <button onClick={() => setShowModal(false)} className="p-3 rounded-full hover:bg-white text-slate-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Collection Name</label>
                                        <input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="e.g. Summer Gala"
                                            className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm font-bold focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hero Banner</label>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                                Upload Image
                                            </button>
                                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                                            }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                                    <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px]">Cancel</button>
                                    <button onClick={async () => {
                                        const payload = new FormData();
                                        payload.append("title", searchQuery);
                                        payload.append("description", "Storefront Exclusive Collection");
                                        payload.append("is_visible", "true");
                                        payload.append("is_active", "true");
                                        if (imageFile) payload.append("image", imageFile);
                                        await createPromotion(payload, token!);
                                        setShowModal(false); loadData();
                                    }} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px]">Create Collection</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <AlertBanner message={error || ""} onClose={() => setError(null)} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                <div className="flex items-center gap-6">
                    <div className={`p-5 ${sectionInfo.bg} rounded-3xl`}>
                        <Icon className={`w-8 h-8 ${sectionInfo.color}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100/50">
                                {isSaving ? "Publishing Changes..." : "Manual Save Mode"}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{currentPromotion?.title || sectionInfo.title}</h1>
                        <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider">Merchandising Studio</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {slug === "exclusive-collection" && currentPromotion && (
                        <button
                            onClick={async () => {
                                await performAutoSave(selectedIds);
                            }}
                            disabled={isSaving}
                            className={`px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-500 shadow-lg flex items-center gap-3 active:scale-95 ${isSaving
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100/50 hover:shadow-indigo-200/50"
                                }`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent animate-spin rounded-full" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save & Publish</span>
                                </>
                            )}
                        </button>
                    )}
                    {slug === "exclusive-collection" && currentPromotion && (
                        <button
                            onClick={() => handleDelete(currentPromotion.id)}
                            className="p-4 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => { setCurrentPromotion(null); setIsDashboard(true); router.push(`?`, { scroll: false }); }} className="px-8 py-4 rounded-2xl text-[10px] uppercase font-black tracking-widest bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> {slug === "exclusive-collection" ? "Back to Collections" : "Exit"}
                    </button>
                </div>
            </div>

            {/* Content Merchandising Studio */}
            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-6">
                    {/* Visual & Sync Control (New) */}
                    {(slug === "exclusive-collection" || currentPromotion?.description?.includes("Exclusive")) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Sync Engine (Entire Categories)</h3>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-bold focus:outline-none"
                                >
                                    <option value="">No Auto-Sync (Manual Only)</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-slate-400 mt-2 font-medium">Link a category to automatically pull all its products into this collection.</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-4">
                                <div className="flex-1">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Collection Banner</h3>
                                    <button onClick={() => fileInputRef.current?.click()} className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                                        Update Hero
                                    </button>
                                    <input
                                        ref={fileInputRef} type="file" className="hidden" accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                                        }}
                                    />
                                </div>
                                {imagePreview && (
                                    <div className="h-16 w-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                        <img src={imagePreview.startsWith('http') ? imagePreview : getMediaUrl(imagePreview)} className="w-full h-full object-cover" alt="Preview" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <CheckCircle className={`w-5 h-5 ${sectionInfo.color}`} />
                            Active Selection
                        </h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedIds.length} Products</span>
                    </div>



                    <div className="bg-white border border-slate-200 rounded-[3rem] p-4 min-h-[500px]">
                        {isLoading && selectedIds.length === 0 ? (
                            <div className="flex items-center justify-center h-[500px]">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
                            </div>
                        ) : selectedProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center p-12">
                                <Layers className="w-16 h-16 text-slate-100 mb-6" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No products in {sectionInfo.title}</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {selectedProducts.map(p => (
                                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 group transition-all hover:bg-white hover:shadow-xl animate-in slide-in-from-top-2">
                                        <div className="h-16 w-16 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                            <img src={getProductImage(p)} className="w-full h-full object-cover" alt={p.name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{p.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${p.base_price}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleProduct(p.id)}
                                            className="p-3 bg-white text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col h-[700px]">
                        <div className="mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 text-slate-400" />
                                Inventory Archive
                            </h3>
                            <div className="mt-6 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Search pieces..."
                                    value={archiveSearchQuery}
                                    onChange={(e) => setArchiveSearchQuery(e.target.value)}
                                    className="w-full py-4 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 transition"
                                />
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar scroll-smooth pr-px">
                            {filteredCatalog.map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 bg-white hover:border-emerald-100 group transition">
                                    <div className="h-12 w-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                        <img src={getProductImage(p)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" alt={p.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{p.name}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${p.base_price}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleProduct(p.id)}
                                        className="p-2.5 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {/* Sidebar Pagination Footer */}
                        {archiveTotalPages > 1 && (
                            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">
                                    Page {archivePage} of {archiveTotalPages}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={archivePage === 1}
                                        onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={archivePage >= archiveTotalPages}
                                        onClick={() => setArchivePage(p => p + 1)}
                                        className="p-2 rounded-lg bg-slate-900 text-white hover:bg-black disabled:opacity-30 transition-all shadow-lg shadow-slate-100"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CatalogSectionPage(props: { params: Promise<{ slug: string }> }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" /></div>}>
            <CatalogSectionContent {...props} />
        </Suspense>
    );
}
