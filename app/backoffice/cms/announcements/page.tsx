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
import { fetchBackofficeProducts } from "@/lib/api/catalog";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/Button";
import type { Announcement, Promotion } from "@/types/cms";
import type { Product } from "@/types/product";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { getMediaUrl } from "@/lib/utils";
import {
    Plus,
    Trash2,
    Search,
    X,
    ExternalLink,
    Image as ImageIcon,
    Pencil,
    Zap,
    Loader2,
    CheckCircle2,
    ChevronDown,
} from "lucide-react";

type PlacementType = "TOP_BAR" | "POPUP" | "FLOATER";

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

export default function AnnouncementsPage() {
    const { token, isAuthenticated } = useAuth();
    const { confirm } = useModal();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [placement, setPlacement] = useState<PlacementType>("TOP_BAR");
    const [title, setTitle] = useState("");
    const [ctaText, setCtaText] = useState("");
    const [redirectUrl, setRedirectUrl] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [destinationType, setDestinationType] = useState<'product' | 'campaign' | 'url'>('url');

    // Image Handling
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [bRes, pRes, promoRes] = await Promise.all([
                fetchBackofficeAnnouncements(token),
                fetchBackofficeProducts(token),
                fetchBackofficePromotions(token, "CAMPAIGN"),
            ]);
            setAnnouncements(bRes);
            setProducts(Array.isArray(pRes) ? pRes : (pRes as any)?.results || []);
            setPromotions(Array.isArray(promoRes) ? promoRes : (promoRes as any)?.results || []);
        } catch {
            setError("Synchronization failed.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) loadData();
    }, [token, isAuthenticated]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !token) return;

        setIsSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", `[${placement}] ${title.trim()}`);
            fd.append("cta_text", ctaText || "");
            fd.append("redirect_url", redirectUrl || "");

            if (destinationType === 'product' && selectedProduct) {
                fd.append("linked_product_id", selectedProduct.id);
            } else if (destinationType === 'campaign' && selectedPromotion) {
                fd.append("linked_promotion_id", selectedPromotion.id);
            }

            fd.append("is_visible", "true");
            if (selectedFile) fd.append("image", selectedFile);

            if (editingId) {
                await updateAnnouncement(editingId, fd as any, token);
            } else {
                await createAnnouncement(fd as any, token);
            }
            setIsFormOpen(false);
            setEditingId(null);
            setSuccess("Announcement saved.");
            setTimeout(() => setSuccess(null), 3000);
            loadData();
        } catch {
            setError("Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (b: Announcement) => {
        const match = b.title.match(/^\[(TOP_BAR|POPUP|FLOATER)\] (.*)/);
        setEditingId(b.id);
        if (match) {
            setPlacement(match[1] as PlacementType);
            setTitle(match[2]);
        } else {
            setPlacement("TOP_BAR");
            setTitle(b.title);
        }

        setCtaText(b.cta_text || "");
        setRedirectUrl(b.redirect_url || "");
        setSelectedProduct(b.linked_product || null);
        setSelectedPromotion(b.linked_promotion || null);

        if (b.linked_product) setDestinationType('product');
        else if (b.linked_promotion) setDestinationType('campaign');
        else setDestinationType('url');

        setPreviewUrl(getMediaUrl((b as any).image) || null);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!token) return;
        confirm({
            title: "Delete Announcement?",
            description: "This action will permanently remove the announcement and its associated media from the storefront.",
            confirmText: "Delete",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteAnnouncement(id, token);
                    setSuccess("Deleted.");
                    setTimeout(() => setSuccess(null), 3000);
                    loadData();
                } catch { setError("Delete failed."); }
            }
        });
    };

    const handleToggleVisibility = async (b: Announcement) => {
        if (!token) return;
        try {
            await updateAnnouncement(b.id, { is_visible: !b.is_visible }, token);
            loadData();
        } catch { setError("Update failed."); }
    };

    return (
        <div className="max-w-[1100px] mx-auto py-8 px-6 space-y-6">
            <AlertBanner message={error || ""} type="error" onClose={() => setError(null)} />
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">Announcement Center</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage banners, popups, and top-bar messages.</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingId(null); setTitle(""); setCtaText("");
                        setPlacement("TOP_BAR"); setDestinationType('url');
                        setSelectedFile(null); setPreviewUrl(null);
                        setIsFormOpen(true);
                    }}
                    className="gap-1.5"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Announcement
                </Button>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Placements</h2>
                    <span className="text-xs text-slate-400">{announcements.length} Published</span>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/20 border-b border-slate-100">
                            {["Banner", "Placement", "Status", "Target", ""].map((h) => (
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
                                        <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : announcements.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">No announcements active.</td></tr>
                        ) : (
                            announcements.map((ann) => {
                                const cleanTitle = ann.title.replace(/\[(TOP_BAR|POPUP|FLOATER)\] /, "");
                                const placementType = ann.title.match(/\[(.*?)\]/)?.[1] || "TOP_BAR";

                                return (
                                    <tr key={ann.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded border bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    {(ann as any).image ? (
                                                        <img src={getMediaUrl((ann as any).image)} className="w-full h-full object-cover" />
                                                    ) : <ImageIcon className="w-3.5 h-3.5 text-slate-300" />}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900 truncate max-w-[240px]">{cleanTitle}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                {placementType.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${ann.is_visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${ann.is_visible ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                {ann.is_visible ? "Live" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[11px] text-slate-500 font-medium font-mono uppercase">
                                            {ann.linked_product ? 'Product' : ann.linked_promotion ? 'Campaign' : 'Direct Link'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(ann)} title="Edit" className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleToggleVisibility(ann)} title={ann.is_visible ? "Hide" : "Show"} className={`p-1.5 rounded transition ${ann.is_visible ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}>
                                                    <Zap className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(ann.id)} title="Delete" className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setIsFormOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-900">
                                {editingId ? "Edit Announcement" : "Create Announcement"}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="px-5 py-5 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Placement" required>
                                    <select value={placement} onChange={e => setPlacement(e.target.value as any)} className={INPUT}>
                                        <option value="TOP_BAR">Homepage Ticker</option>
                                        <option value="POPUP">Store Modal (Center)</option>
                                        <option value="FLOATER">Corner Floater</option>
                                    </select>
                                </Field>
                                <Field label="Campaign Identifier" required>
                                    <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Summer Sale" className={INPUT} />
                                </Field>
                            </div>

                            <Field label="Call to Action Text">
                                <input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="e.g. Shop Now" className={INPUT} />
                            </Field>

                            <div className="space-y-3">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Target Destination</p>
                                <div className="flex gap-1">
                                    {(['url', 'product', 'campaign'] as const).map(t => (
                                        <button
                                            key={t} type="button" onClick={() => setDestinationType(t)}
                                            className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border transition ${destinationType === t ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {t.toUpperCase()}
                                        </button>
                                    ))}
                                </div>

                                {destinationType === 'url' ? (
                                    <Field label="Direct Path / URL">
                                        <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="/shop/new-arrivals" className={INPUT} />
                                    </Field>
                                ) : (
                                    <div className="space-y-1 relative" ref={searchRef}>
                                        <label className="text-xs font-medium text-slate-600">Link {destinationType}</label>
                                        <div className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-1.5 bg-white focus-within:border-slate-400">
                                            <Search className="w-3 h-3 text-slate-300" />
                                            <input
                                                value={searchQuery} onFocus={() => setShowDropdown(true)} onChange={e => setSearchQuery(e.target.value)}
                                                placeholder={`Click to search ${destinationType}s...`}
                                                className="flex-1 bg-transparent text-sm outline-none"
                                            />
                                        </div>
                                        {(selectedProduct || selectedPromotion) && (
                                            <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[11px] font-medium text-emerald-700 truncate">
                                                    Linked: {selectedProduct?.name || selectedPromotion?.title}
                                                </span>
                                            </div>
                                        )}
                                        {showDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                                                {(destinationType === 'product' ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : promotions.filter(p => (p as any).title?.toLowerCase().includes(searchQuery.toLowerCase()))).map((item: any) => (
                                                    <button
                                                        key={item.id} type="button"
                                                        onClick={() => {
                                                            if (destinationType === 'product') { setSelectedProduct(item); setSelectedPromotion(null); }
                                                            else { setSelectedPromotion(item); setSelectedProduct(null); }
                                                            setShowDropdown(false); setSearchQuery("");
                                                        }}
                                                        className="w-full px-4 py-2 text-left hover:bg-slate-50 text-xs font-medium text-slate-700 border-b last:border-0"
                                                    >
                                                        {item.name || item.title}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Field label="Banner Asset (Recommended for Popups)">
                                <div className={`aspect-video rounded-md border-2 border-dashed flex flex-col items-center justify-center bg-slate-50 relative group transition-colors ${placement === 'TOP_BAR' ? 'opacity-30 cursor-not-allowed' : 'border-slate-200 hover:border-slate-400 cursor-pointer'}`}>
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-200" />
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase">Upload Media</p>
                                        </div>
                                    )}
                                    {placement !== 'TOP_BAR' && (
                                        <input
                                            type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) { setSelectedFile(f); setPreviewUrl(URL.createObjectURL(f)); }
                                            }}
                                        />
                                    )}
                                </div>
                            </Field>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={isSaving}>
                                    {editingId ? "Update Published" : "Publish to Store"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
