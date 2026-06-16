"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficePromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
} from "@/lib/api/cms";
import type { Promotion } from "@/types/cms";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { getMediaUrl } from "@/lib/utils";
import {
    Plus,
    Trash2,
    Search,
    X,
    ExternalLink,
    Image as ImageIcon,
    Filter,
    ArrowRight,
    Eye,
    EyeOff,
    Edit,
    ChevronDown,
    ArrowUpCircle
} from "lucide-react";

export default function MarketingPage() {
    const { token, isAuthenticated } = useAuth();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form State
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [ctaLink, setCtaLink] = useState("");

    const loadData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchBackofficePromotions(token, "BANNER");
            setAllCampaigns(data.filter(p => p.promotion_type === "CAMPAIGN"));
            const bannerPromos = data.filter(p => p.promotion_type === "BANNER");
            setPromotions(bannerPromos);
        } catch {
            setError("Failed to synchronize storefront visuals.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) loadData();
    }, [token, isAuthenticated]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) return;

        const formData = new FormData(e.currentTarget);
        if (!editingPromo && !selectedFile) {
            setError("Please upload a banner creative.");
            return;
        }

        setIsSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", formData.get("title") as string);
            fd.append("promotion_type", "BANNER");
            fd.append("description", formData.get("description") as string || "");
            fd.append("sort_order", formData.get("sort_order") as string || "0");
            fd.append("is_visible", formData.get("is_visible") === "on" ? "true" : "false");
            fd.append("cta_text", formData.get("cta_text") as string || "");
            fd.append("cta_link", ctaLink || formData.get("cta_link") as string || "");

            if (selectedFile) fd.append("image", selectedFile);

            if (editingId) {
                await updatePromotion(editingId, fd, token);
                setSuccess("Banner updated.");
            } else {
                await createPromotion(fd, token);
                setSuccess("Banner deployed.");
            }
            setIsCreating(false);
            setEditingPromo(null);
            loadData();
        } catch {
            setError("Failed to save banner.");
        } finally {
            setIsSaving(false);
        }
    };

    const editingId = editingPromo?.id;

    return (
        <div className="max-w-[1400px] mx-auto py-8 px-8 space-y-10 animate-in fade-in duration-300">
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* HEADER */}
            <div className="flex items-end justify-between border-b pb-6">
                <div className="space-y-1">
                    <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Visual Merchandising</h1>
                    <p className="text-sm text-slate-500 font-medium">Curate hero promotions and interactive banners for your website storefront.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => {
                            setEditingPromo(null); setPreviewUrl(null);
                            setSelectedFile(null); setCtaLink(""); setIsCreating(true);
                        }}
                        className="bg-slate-900 text-white px-4 py-2.5 rounded-md text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Publish Banner
                    </button>
                )}
            </div>

            {/* MANAGEMENT TABLE */}
            {!isCreating && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Visual Banners</h2>
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            <input placeholder="Filter visual assets..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium w-48 outline-none" />
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b">
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Creative Preview</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Internal Label</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Priority</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-sm text-slate-400 font-medium tracking-tight">Syncing visual library...</td></tr>
                                ) : promotions.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-sm text-slate-400 font-medium tracking-tight">No active visual banners.</td></tr>
                                ) : (
                                    promotions.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="w-24 aspect-[21/9] rounded-md border bg-slate-50 overflow-hidden shrink-0">
                                                    {p.image && <img src={getMediaUrl(p.image)} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <span className="text-[13px] font-bold text-slate-900 block">{p.title}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.cta_text || 'No CTA Label'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {p.is_visible ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">Live</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200">Draft</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                                                    <ArrowUpCircle className={`w-3.5 h-3.5 ${p.sort_order === 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                                                    {p.sort_order}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => { setEditingPromo(p); setCtaLink(p.cta_link || ""); setIsCreating(true); }} className="text-[11px] font-bold text-slate-950 hover:underline">Edit</button>
                                                    <button onClick={() => deletePromotion(p.id, token!).then(() => loadData())} className="text-[11px] font-bold text-rose-600 hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PUBLISHING FORM */}
            {isCreating && (
                <div className="max-w-4xl animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[18px] font-bold text-slate-900">{editingPromo ? 'Edit Visual Banner' : 'Publish New Visual Asset'}</h2>
                        <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
                    </div>

                    <form onSubmit={handleSave} className="bg-white border rounded-lg shadow-sm">
                        <div className="p-8 space-y-10 divide-y divide-slate-100">
                            {/* SECTION 1: IDENTITY */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-1 pt-2">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Banner Context</h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Define the primary messaging and sorting priority.</p>
                                </div>
                                <div className="md:col-span-2 space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Banner Headline</label>
                                        <input name="title" defaultValue={editingPromo?.title} required placeholder="The Summer Collection" className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[13px] font-bold text-slate-900 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Description (Sub-header)</label>
                                            <input name="description" defaultValue={editingPromo?.description} className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-[13px] font-bold outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Priority Order</label>
                                            <input name="sort_order" type="number" defaultValue={editingPromo?.sort_order ?? 0} className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-[13px] font-bold outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: LINKAGE */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
                                <div className="space-y-1 pt-2">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Storefront Target</h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Where should the user go when clicking this banner?</p>
                                </div>
                                <div className="md:col-span-2 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Button Text</label>
                                            <input name="cta_text" defaultValue={editingPromo?.cta_text || 'Explore'} className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-[13px] font-bold outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Destination Path</label>
                                            <input name="cta_link" value={ctaLink} onChange={e => setCtaLink(e.target.value)} placeholder="/shop-now" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-[13px] font-bold outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Quick Link to Campaign</label>
                                        <select onChange={e => setCtaLink(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[13px] font-bold outline-none">
                                            <option value="">Manually entering path...</option>
                                            {allCampaigns.map(c => <option key={c.id} value={`/promotions/${(c as any).slug || c.id}`}>→ {c.title}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: VISUAL ASSET */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
                                <div className="space-y-1 pt-2">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Creative Asset</h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Recommended resolution: 1920 × 1080 (16:9 ratio).</p>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="aspect-[21/9] rounded-md border-2 border-dashed flex items-center justify-center bg-slate-50 relative group transition-all hover:bg-white hover:border-slate-300">
                                        {(previewUrl || editingPromo?.image) ? (
                                            <img src={previewUrl || getMediaUrl(editingPromo?.image)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                                                <p className="text-[10px] font-black uppercase text-slate-400">Click to upload banner</p>
                                            </div>
                                        )}
                                        <input
                                            type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) { setSelectedFile(f); setPreviewUrl(URL.createObjectURL(f)); }
                                            }}
                                        />
                                    </div>
                                    <div className="mt-6 flex items-center gap-3 bg-slate-50 p-4 rounded-md border border-slate-200">
                                        <input type="checkbox" name="is_visible" defaultChecked={editingPromo?.is_visible ?? true} className="w-5 h-5 accent-slate-900 h-4 w-4" />
                                        <span className="text-[11px] font-bold text-slate-900 uppercase">Live on Storefront</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-6 flex justify-end gap-2 border-t">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2 text-[12px] font-bold text-slate-500 uppercase tracking-tight">Cancel</button>
                            <button type="submit" disabled={isSaving} className="bg-slate-950 text-white px-10 py-2 rounded-md text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm">
                                {isSaving ? 'Processing...' : 'Publish Banner'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
