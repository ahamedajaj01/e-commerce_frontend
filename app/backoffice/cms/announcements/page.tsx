"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficeAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    fetchBackofficePromotions,
} from "@/lib/api/cms";
import { fetchBackofficeProducts, createProduct } from "@/lib/api/catalog";
import type { Announcement, Promotion } from "@/types/cms";
import type { Product } from "@/types/product";
import { AlertBanner } from "@/components/ui/AlertBanner";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Search, X, Megaphone, ShoppingBag, Edit } from "lucide-react";

// ── Preset heading suggestions the client can pick quickly ─────────────────
const HEADING_PRESETS = [
    "🔥 Clearance Sale — Up to 70% Off!",
    "🚚 Free Shipping on Orders Above NPR 999",
    "✨ New Arrivals Just Dropped",
    "⏳ Limited Time Offer — Ends Sunday!",
    "🎉 Festival Special — Extra 20% Off",
];

export default function AnnouncementsPage() {
    const { token, isAuthenticated } = useAuth();

    const [banners, setBanners] = useState<Announcement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Master ON/OFF — derived from whether any banner is_visible
    const [barEnabled, setBarEnabled] = useState(false);


    // Add-promotion form
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [heading, setHeading] = useState("");
    const [ctaText, setCtaText] = useState("Shop Now");
    const [redirectUrl, setRedirectUrl] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [productSearch, setProductSearch] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [destinationType, setDestinationType] = useState<'product' | 'campaign' | 'url'>('product');
    const [headingError, setHeadingError] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [bData, pData, promoData] = await Promise.all([
                fetchBackofficeAnnouncements(token),
                fetchBackofficeProducts(token),
                fetchBackofficePromotions(token),
            ]);
            // Only keep Announcements (which have no image)
            const pureAnnouncements = bData.filter((b: any) => !b.image && (!b.images || b.images.length === 0));
            setBanners(pureAnnouncements);
            const promoArr = Array.isArray(promoData) ? promoData : (promoData as any)?.results || [];

            // For the dropdown, we only want to show visual campaigns (which have images)
            const visualPromos = promoArr.filter((p: any) =>
                p.title !== "Homepage Selection" &&
                p.description !== "Storefront Exclusive Collection" &&
                (p.image || (p.images && p.images.length > 0))
            );
            setPromotions(visualPromos);

            // Only sync the master toggle from the server when there are actual
            // banners to read from. If the list is empty (e.g. right after
            // toggling ON before any banner is created) keep the current state.
            if (pureAnnouncements.length > 0) {
                setBarEnabled(pureAnnouncements.some((b: any) => b.is_visible));
            }
            const pArr = Array.isArray(pData) ? pData : (pData as any)?.results || [];
            setProducts(pArr);
        } catch {
            setError("Failed to load promotions.");
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

    // ── Master toggle: flip is_visible on ALL banners at once ─────────────────
    const handleMasterToggle = async () => {
        if (!token) return;
        const nextState = !barEnabled;
        setBarEnabled(nextState);
        try {
            await Promise.all(
                banners.map((b) => updateAnnouncement(b.id, { is_visible: nextState }, token))
            );
            setSuccess(nextState ? "Promotions bar is now LIVE on your store!" : "Promotions bar hidden from customers.");
            load();
        } catch {
            setError("Failed to update. Please try again.");
            setBarEnabled(!nextState); // revert
        }
    };

    // ── Per-banner toggle ─────────────────────────────────────────────────────
    const handleSingleToggle = async (b: Announcement) => {
        if (!token) return;
        try {
            await updateAnnouncement(b.id, { is_visible: !b.is_visible }, token);
            setSuccess(`"${b.title}" ${b.is_visible ? "hidden" : "made visible"}.`);
            load();
        } catch {
            setError("Failed to update.");
        }
    };

    // ── Save promotion (Create or Update) ───────────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!heading.trim()) {
            setHeadingError(true);
            // Scroll the heading field into view
            document.getElementById('announcement-heading')?.focus();
            return;
        }
        if (!token) return;
        setHeadingError(false);
        setIsSaving(true);
        setError(null);
        try {
            const payload = {
                title: heading.trim(),
                cta_text: ctaText || undefined,
                redirect_url: redirectUrl || undefined,
                linked_product_id: selectedProduct?.id || undefined,
                linked_promotion_id: selectedPromotion?.id || undefined,
                is_visible: barEnabled,
            };

            if (editingId) {
                await updateAnnouncement(editingId, payload, token);
                setSuccess("Promotion updated!");
            } else {
                await createAnnouncement(payload, token);
                setSuccess("Promotion added!");
            }

            setHeading(""); setCtaText("Shop Now"); setRedirectUrl(""); setSelectedProduct(null); setSelectedPromotion(null); setProductSearch(""); setShowForm(false); setEditingId(null); setHeadingError(false);
            load();
        } catch (err: any) {
            setError(err.message || "Failed to save promotion.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (b: Announcement) => {
        setEditingId(b.id);
        setHeading(b.title);
        setCtaText(b.cta_text || "Shop Now");
        setRedirectUrl(b.redirect_url || "");
        setSelectedProduct(b.linked_product || null);
        setSelectedPromotion(b.linked_promotion || null);
        // Set the destination type based on what's linked
        if (b.linked_product) setDestinationType('product');
        else if (b.linked_promotion) setDestinationType('campaign');
        else if (b.redirect_url) setDestinationType('url');
        else setDestinationType('product');
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!token || !confirm("Remove this promotion?")) return;
        try {
            await deleteAnnouncement(id, token);
            setSuccess("Promotion removed.");
            load();
        } catch { setError("Failed to remove."); }
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {error && (
                <AlertBanner message={error} type="error" onClose={() => setError(null)} />
            )}
            {success && (
                <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />
            )}

            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <Link href="/backoffice/dashboard" className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 bg-purple-50 rounded-2xl">
                        <Megaphone className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Promotions Bar</h1>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">The scrolling announcement customers see at the top of every page</p>
                    </div>
                </div>
                {barEnabled && (
                    <Link href="/backoffice/cms/promotions" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition border border-indigo-100/50">
                        <ShoppingBag className="w-3.5 h-3.5" /> Manage Sale Campaigns
                    </Link>
                )}
            </div>

            {/* ── MASTER ON/OFF CARD ─────────────────────────────────────── */}
            <div className={`rounded-[2rem] border-2 p-8 transition-all duration-300 ${barEnabled
                ? "border-emerald-400 bg-emerald-50"
                : "border-slate-200 bg-white"
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Master Switch</p>
                        <h2 className="text-2xl font-black text-slate-900">
                            {barEnabled ? "🟢 Promotions Bar is ON" : "⚫ Promotions Bar is OFF"}
                        </h2>
                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">
                            {barEnabled
                                ? "Customers can see your promotions right now. Toggle OFF to hide all of them instantly."
                                : "Nothing is showing. Toggle ON to make your promotions visible to all customers."}
                        </p>
                    </div>

                    {/* Big toggle switch */}
                    <button
                        onClick={handleMasterToggle}
                        disabled={isLoading}
                        className={`relative flex-shrink-0 h-14 w-24 rounded-full border-2 transition-all duration-300 focus:outline-none ${barEnabled
                            ? "bg-emerald-500 border-emerald-400"
                            : "bg-slate-200 border-slate-300"
                            }`}
                    >
                        <span className={`absolute top-1.5 h-10 w-10 rounded-full bg-white shadow-lg transition-all duration-300 ${barEnabled ? "left-12" : "left-2"
                            }`} />
                    </button>
                </div>
            </div>

            {/* ── PROMOTIONS LIST — only visible when bar is ON ─────────── */}
            {!barEnabled && !isLoading && (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-2xl mb-2">💤</p>
                    <p className="text-sm font-black text-slate-500">Promotions bar is OFF</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Toggle it ON above to manage and publish promotions.</p>
                </div>
            )}

            {barEnabled && (isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                            Your Promotions ({banners.length})
                        </h3>
                    </div>

                    {banners.length === 0 && (
                        <div className="rounded-[2rem] border border-dashed border-slate-200 p-10 text-center bg-slate-50">
                            <p className="text-2xl mb-2">📭</p>
                            <p className="text-sm font-bold text-slate-400">No promotions yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Click "Add New Promotion" below to create your first one.</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {banners.map((b) => (
                            <div
                                key={b.id}
                                className={`rounded-[1.5rem] border p-5 flex items-center gap-4 transition-all ${b.is_visible
                                    ? "bg-white border-slate-200"
                                    : "bg-slate-50 border-slate-100 opacity-60"
                                    }`}
                            >
                                {/* Visible toggle */}
                                <button
                                    onClick={() => handleSingleToggle(b)}
                                    title={b.is_visible ? "Click to hide" : "Click to show"}
                                    className={`relative flex-shrink-0 h-7 w-12 rounded-full transition-colors duration-200 ${b.is_visible ? "bg-emerald-500" : "bg-slate-300"
                                        }`}
                                >
                                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${b.is_visible ? "left-6" : "left-1"
                                        }`} />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 text-sm truncate">{b.title}</p>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        {b.cta_text && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-purple-50 text-purple-500 rounded-full">{b.cta_text}</span>
                                        )}
                                        {b.linked_product && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-fuchsia-50 text-fuchsia-500 rounded-full">
                                                🔗 {b.linked_product.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(b)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="flex-shrink-0 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* ── ADD PROMOTION — only when bar is ON ───────────────────── */}
            {barEnabled && (!showForm ? (
                <button
                    onClick={() => {
                        setEditingId(null);
                        setHeading("");
                        setCtaText("Shop Now");
                        setRedirectUrl("");
                        setSelectedProduct(null);
                        setSelectedPromotion(null);
                        setDestinationType('product');
                        setShowForm(true);
                    }}
                    className="w-full py-5 rounded-[2rem] border-2 border-dashed border-purple-300 text-purple-500 hover:border-purple-500 hover:bg-purple-50 transition font-black text-sm flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add New Promotion
                </button>
            ) : (
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            {editingId ? <Edit className="w-5 h-5 text-purple-500" /> : <Plus className="w-5 h-5 text-purple-500" />}
                            {editingId ? "Edit Promotion" : "New Promotion"}
                        </h3>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"><X className="w-4 h-4" /></button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-5">

                        {/* Heading */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Promotion Heading <span className="text-rose-400">*</span>
                            </label>
                            <input
                                id="announcement-heading"
                                value={heading}
                                onChange={(e) => { setHeading(e.target.value); if (e.target.value.trim()) setHeadingError(false); }}
                                placeholder="e.g. Summer Sale — 50% Off Everything!"
                                className={`w-full rounded-2xl bg-slate-50 border p-4 text-sm font-bold focus:outline-none focus:ring-2 transition-all ${headingError
                                    ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50 placeholder-rose-300'
                                    : 'border-slate-100 focus:ring-purple-100'
                                    }`}
                            />
                            {headingError && (
                                <p className="text-xs font-bold text-rose-500 mt-1">⚠ Please type a heading for this promotion first.</p>
                            )}
                            {/* Quick preset suggestions */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {HEADING_PRESETS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setHeading(p)}
                                        className="text-[9px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-600 text-slate-500 rounded-full transition"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CTA Button label */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Button Label (what the customer clicks)</label>
                            <input
                                value={ctaText}
                                onChange={(e) => setCtaText(e.target.value)}
                                placeholder="e.g. Shop Now / Grab the Deal"
                                className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-100"
                            />
                        </div>

                        {/* Link a product from catalog OR custom URL */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link a Destination (Optional)</p>
                            <p className="text-xs text-slate-400 font-medium -mt-2">Where should the customer go after clicking?</p>

                            {/* Destination Type Tabs */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setDestinationType('product'); setSelectedPromotion(null); setRedirectUrl(""); }}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${destinationType === 'product' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                >
                                    Single Product
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setDestinationType('campaign'); setSelectedProduct(null); setRedirectUrl(""); setProductSearch(""); }}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${destinationType === 'campaign' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                >
                                    Sale Campaign
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setDestinationType('url'); setSelectedProduct(null); setSelectedPromotion(null); setProductSearch(""); }}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${destinationType === 'url' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                >
                                    Custom URL
                                </button>
                            </div>

                            <div className="space-y-3" ref={searchRef}>

                                {/* ── PRODUCT search ── */}
                                {destinationType === 'product' && (
                                    selectedProduct ? (
                                        <div className="flex items-center justify-between bg-fuchsia-50 border border-fuchsia-100 rounded-2xl px-4 py-3">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-400 mb-0.5">Target Product</p>
                                                <p className="text-sm font-black text-fuchsia-700 uppercase tracking-tight">{selectedProduct.name}</p>
                                            </div>
                                            <button type="button" onClick={() => { setSelectedProduct(null); setProductSearch(""); }} className="ml-3 flex-shrink-0 p-1.5 rounded-full hover:bg-fuchsia-100 text-fuchsia-400 transition">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4">
                                                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <input
                                                    value={productSearch}
                                                    onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                                                    onFocus={() => setShowProductDropdown(true)}
                                                    placeholder="Search your products by name..."
                                                    className="flex-1 py-4 bg-transparent text-sm font-bold focus:outline-none"
                                                />
                                            </div>
                                            {showProductDropdown && (
                                                <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto font-sans">
                                                    {filteredProducts.length === 0 ? (
                                                        <p className="px-6 py-8 text-xs text-slate-400 font-medium text-center">No products found.</p>
                                                    ) : (
                                                        filteredProducts.slice(0, 10).map((p) => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => { setSelectedProduct(p); setProductSearch(""); setShowProductDropdown(false); }}
                                                                className="w-full px-6 py-4 text-left hover:bg-fuchsia-50 transition border-b border-slate-50 last:border-0 flex items-center gap-4"
                                                            >
                                                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                                    {p.media?.[0]?.file_url && <img src={p.media[0].file_url} className="w-full h-full object-cover" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-black text-slate-900 truncate">{p.name}</p>
                                                                    <p className="text-[10px] text-fuchsia-500 font-black uppercase tracking-widest mt-1">Product • NPR {p.base_price || "0"}</p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}

                                {/* ── CAMPAIGN search ── */}
                                {destinationType === 'campaign' && (
                                    selectedPromotion ? (
                                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Target Sale Campaign</p>
                                                <p className="text-sm font-black text-emerald-700 uppercase tracking-tight">{selectedPromotion.title}</p>
                                            </div>
                                            <button type="button" onClick={() => setSelectedPromotion(null)} className="ml-3 flex-shrink-0 p-1.5 rounded-full hover:bg-emerald-100 text-emerald-400 transition">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4">
                                                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <input
                                                    value={productSearch}
                                                    onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                                                    onFocus={() => setShowProductDropdown(true)}
                                                    placeholder="Search sale campaigns..."
                                                    className="flex-1 py-4 bg-transparent text-sm font-bold focus:outline-none"
                                                />
                                            </div>
                                            {showProductDropdown && (
                                                <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                                                    {promotions.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                                                        <p className="px-6 py-8 text-xs text-slate-400 font-medium text-center">No sale campaigns found.</p>
                                                    ) : (
                                                        promotions
                                                            .filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase()))
                                                            .map(promo => (
                                                                <button
                                                                    key={promo.id}
                                                                    type="button"
                                                                    onClick={() => { setSelectedPromotion(promo); setShowProductDropdown(false); setProductSearch(""); }}
                                                                    className="w-full px-6 py-4 text-left hover:bg-emerald-50 transition border-b border-slate-50 last:border-0 flex items-center justify-between"
                                                                >
                                                                    <div>
                                                                        <p className="text-sm font-black text-slate-900">{promo.title}</p>
                                                                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Sale Campaign • {promo.products?.length || 0} Items</p>
                                                                    </div>
                                                                    <Plus className="w-4 h-4 text-emerald-300" />
                                                                </button>
                                                            ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}

                                {/* ── CUSTOM URL ── */}
                                {destinationType === 'url' && (
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enter a page URL</p>
                                        <input
                                            value={redirectUrl}
                                            onChange={(e) => setRedirectUrl(e.target.value)}
                                            placeholder="e.g. /sale  or  https://..."
                                            className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-100"
                                        />
                                    </div>
                                )}

                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 text-sm font-black hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 py-4 rounded-2xl bg-purple-600 text-white text-sm font-black shadow-lg shadow-purple-200 hover:bg-purple-700 transition disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : (editingId ? "Update Promotion →" : "Add Promotion →")}
                            </button>
                        </div>
                    </form>
                </div>
            ))}
        </div>
    );
}
