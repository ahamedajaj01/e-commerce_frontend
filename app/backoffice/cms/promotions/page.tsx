"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficePromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
} from "@/lib/api/cms";
import {
    fetchBackofficeProducts,
    fetchBackofficeProductIds,
    fetchBackofficeCategories,
    fetchBackofficeBrands
} from "@/lib/api/catalog";
import type { Promotion } from "@/types/cms";
import type { Category, Brand, Product } from "@/types/product";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
    Plus,
    Search,
    X,
    Trash2,
    Calendar,
    ArrowRight,
    ShoppingBag,
    CheckCircle2,
    Settings2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Filter,
} from "lucide-react";
import { getProductImage } from "@/lib/utils";

const INPUT =
    "w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition placeholder:text-slate-300";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

export default function PromotionsPage() {
    const { token, isAuthenticated } = useAuth();
    const { confirm } = useModal();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Management Console State
    const [showConsole, setShowConsole] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    // Automation Rules
    const [selCategory, setSelCategory] = useState("");
    const [selBrand, setSelBrand] = useState("");

    // Merchandising Selection
    const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [catalogSearch, setCatalogSearch] = useState("");
    const [stockStatus, setStockStatus] = useState("all");
    const [catalogPage, setCatalogPage] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Metadata
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const loadPromotions = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchBackofficePromotions(token, "CAMPAIGN");
            const results = Array.isArray(data) ? data : (data as any).results || [];

            // Hard filtering to exclude SYSTEM, BANNER, and EXCLUSIVE types
            // Also exclude reserved system titles just in case of mis-tagging
            const systemTitles = ["Homepage Selection", "Trending Now", "Best Sellers", "New Arrivals"];
            const filtered = results.filter((p: any) =>
                p.promotion_type === "CAMPAIGN" &&
                !systemTitles.includes(p.title) &&
                p.description !== "Storefront Exclusive Collection"
            );
            setPromotions(filtered);
        } catch {
            setError("Failed to load campaigns.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadMetadata = async () => {
        if (!token) return;
        try {
            const [catRes, brandRes] = await Promise.all([
                fetchBackofficeCategories(token),
                fetchBackofficeBrands(token)
            ]);
            setCategories(Array.isArray(catRes) ? catRes : (catRes as any).results || []);
            setBrands(Array.isArray(brandRes) ? brandRes : (brandRes as any).results || []);
        } catch { }
    };

    const loadCatalog = async () => {
        if (!token) return;
        setIsSearching(true);
        try {
            const res = await fetchBackofficeProducts(token, {
                search: catalogSearch,
                category: selCategory,
                brand: selBrand,
                stock_status: stockStatus,
                page: catalogPage,
                page_size: 20
            });
            setCatalogProducts(res.results || []);
        } catch { } finally { setIsSearching(false); }
    };

    useEffect(() => {
        if (isAuthenticated && token) {
            loadPromotions();
            loadMetadata();
        }
    }, [token, isAuthenticated]);

    useEffect(() => {
        if (showConsole) {
            loadCatalog();
        }
    }, [showConsole, catalogSearch, selCategory, selBrand, stockStatus, catalogPage]);

    const openConsole = (promo?: Promotion) => {
        setCatalogPage(1);
        if (promo) {
            setEditingId(promo.id);
            setTitle(promo.title);
            setSlug((promo as any).slug || "");
            setDescription(promo.description || "");
            setStartDate((promo as any).start_date || "");
            setEndDate((promo as any).end_date || "");
            setIsPublic(promo.is_visible !== false);
            setSelectedIds(promo.products?.map((p: any) => p.id) || []);
            setSelCategory((promo as any).target_category || "");
            setSelBrand((promo as any).target_brand || "");
        } else {
            setEditingId(null); setTitle(""); setSlug(""); setDescription("");
            setStartDate(""); setEndDate(""); setIsPublic(true);
            setSelectedIds([]); setSelCategory(""); setSelBrand("");
        }
        setShowConsole(true);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!token) return;

        setIsSaving(true);
        const payload = {
            title, slug, description,
            promotion_type: "CAMPAIGN",
            start_date: startDate || null,
            end_date: endDate || null,
            is_visible: isPublic,
            product_ids: selectedIds,
            target_category: selCategory || null,
            target_brand: selBrand || null
        };

        try {
            if (editingId) {
                await updatePromotion(editingId, payload, token);
            } else {
                await createPromotion(payload, token);
            }
            setShowConsole(false);
            setSuccess("Campaign configuration saved.");
            setTimeout(() => setSuccess(null), 3000);
            loadPromotions();
        } catch { setError("Failed to save campaign."); }
        finally { setIsSaving(false); }
    };

    const toggleProduct = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="max-w-[1100px] mx-auto py-8 px-6 space-y-6">
            <AlertBanner message={error || ""} type="error" onClose={() => setError(null)} />
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">Campaign Studio</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage sale events, curated collections, and discount groups.</p>
                </div>
                {!showConsole && (
                    <Button
                        onClick={() => openConsole()}
                        className="gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Create Campaign
                    </Button>
                )}
            </div>

            {/* Dashboard Table */}
            {!showConsole && (
                <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Campaigns</h2>
                        <span className="text-xs text-slate-400">{promotions.length} Total</span>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20 border-b border-slate-100">
                                {["Campaign Name", "Status", "Items", "Schedule", ""].map((h) => (
                                    <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap last:text-right">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array(5).fill(0).map((__, j) => (
                                            <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : promotions.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">No campaigns found.</td></tr>
                            ) : (
                                promotions.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900">{p.title}</span>
                                                <span className="text-[11px] text-slate-400 font-mono">{(p as any).slug}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${p.is_visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${p.is_visible ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                {p.is_visible ? "Live" : "Draft"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-semibold text-slate-900">{p.products?.length || 0}</span>
                                            <span className="text-[10px] text-slate-400 ml-1 uppercase">SKUs</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                <Calendar className="w-3 h-3" />
                                                {(p as any).start_date ? new Date((p as any).start_date).toLocaleDateString() : 'Now'}
                                                <ArrowRight className="w-2.5 h-2.5 mx-1" />
                                                {(p as any).end_date ? new Date((p as any).end_date).toLocaleDateString() : 'Forever'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openConsole(p)} title="Edit / Merchandise" className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        confirm({
                                                            title: "Delete Campaign?",
                                                            description: `Are you sure you want to delete "${p.title}"? This will remove the campaign and its merchandising curations from the storefront.`,
                                                            confirmText: "Delete",
                                                            variant: "danger",
                                                            onConfirm: async () => {
                                                                await deletePromotion(p.id, token!);
                                                                loadPromotions();
                                                            }
                                                        });
                                                    }}
                                                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MERCHANDISING WORKBENCH (FULL SCREEN) */}
            {showConsole && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowConsole(false)} className="p-2 -ml-2 rounded-md hover:bg-slate-100 transition text-slate-500">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col">
                                <h2 className="text-sm font-semibold text-slate-900">{editingId ? `Merchandising: ${title}` : 'Build New Campaign'}</h2>
                                <p className="text-[11px] text-slate-400">{selectedIds.length} items curated</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={() => setShowConsole(false)}>Cancel</Button>
                            <Button
                                onClick={() => handleSave()}
                                loading={isSaving}
                                className="min-w-[140px]"
                            >
                                Save Campaign
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* LEFT: SETTINGS (240px) */}
                        <aside className="w-[300px] border-r border-slate-200 bg-slate-50/30 p-6 overflow-y-auto space-y-8 shrink-0">
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Campaign Settings</p>
                                <Field label="Campaign Title" required>
                                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Summer Sale..." className={INPUT} />
                                </Field>
                                <Field label="Campaign Slug" required>
                                    <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="summer-sale" className={INPUT} />
                                </Field>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Scheduling</p>
                                <div className="grid grid-cols-1 gap-4">
                                    <Field label="Start Date">
                                        <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={INPUT} />
                                    </Field>
                                    <Field label="End Date">
                                        <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className={INPUT} />
                                    </Field>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Automation Rules</p>
                                <Field label="Category Filter">
                                    <select value={selCategory} onChange={e => setSelCategory(e.target.value)} className={INPUT}>
                                        <option value="">No filter</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Brand Filter">
                                    <select value={selBrand} onChange={e => setSelBrand(e.target.value)} className={INPUT}>
                                        <option value="">No filter</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </aside>

                        {/* RIGHT: CATALOG SELECTION (split view) */}
                        <main className="flex-1 flex flex-col bg-white overflow-hidden">
                            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/30">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                                            placeholder="Search products..."
                                            className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-4 py-1.5 text-xs font-medium outline-none focus:border-slate-400"
                                        />
                                    </div>
                                    <select
                                        value={stockStatus} onChange={e => setStockStatus(e.target.value)}
                                        className="text-xs font-medium bg-white border border-slate-200 rounded-md py-1.5 px-3 outline-none"
                                    >
                                        <option value="all">All Inventory</option>
                                        <option value="in_stock">In Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1 pl-4">
                                    <button disabled={catalogPage === 1} onClick={() => setCatalogPage(p => p - 1)} className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-20 transition"><ChevronLeft className="w-4 h-4" /></button>
                                    <button onClick={() => setCatalogPage(p => p + 1)} className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 transition"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/10">
                                {isSearching ? (
                                    <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                                ) : (
                                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                                        {catalogProducts.map(p => {
                                            const active = selectedIds.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id} onClick={() => toggleProduct(p.id)}
                                                    className={`group relative bg-white border rounded-lg transition-all cursor-pointer overflow-hidden ${active ? 'border-slate-900 ring-2 ring-slate-900/5' : 'border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    <div className="aspect-[3/4] relative bg-slate-100 overflow-hidden">
                                                        <img src={getProductImage(p)} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                        <div className={`absolute top-2 right-2 h-5 w-5 rounded flex items-center justify-center transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-white/80 border text-slate-300'}`}>
                                                            {active ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                        </div>
                                                    </div>
                                                    <div className="p-2.5">
                                                        <p className="text-[11px] font-semibold text-slate-900 truncate">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">NPR {p.base_price}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
}
