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
import Link from "next/link";
import {
    ArrowLeft, Image as ImageIcon, Plus, Trash2,
    Save, Sparkles, Eye, EyeOff, MoveUp, Edit2, X
} from "lucide-react";

export default function MarketingPage() {
    const { token, isAuthenticated } = useAuth();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form State
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const loadData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchBackofficePromotions(token);
            // Filter out system promotions AND Announcements (Announcements lack images)
            const bannerPromos = data.filter(p =>
                p.description !== "Storefront Exclusive Collection" &&
                p.title !== "Homepage Selection" &&
                (p.image || (p.images && p.images.length > 0))
            );
            setPromotions(bannerPromos);
        } catch (err) {
            setError("Failed to load campaign data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) loadData();
    }, [token, isAuthenticated]);

    const openCreate = () => {
        setEditingPromo(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsCreating(true);
    };

    const openEdit = (promo: Promotion) => {
        setEditingPromo(promo);
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsCreating(true);
    };

    const closeForm = () => {
        setEditingPromo(null);
        setIsCreating(false);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) return;

        const form = e.currentTarget;
        const formData = new FormData(form);

        if (!editingPromo && !selectedFile) {
            setError("Please select a campaign image to launch.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const fd = new FormData();
            fd.append("title", formData.get("title") as string);
            fd.append("description", formData.get("description") as string || "");
            fd.append("sort_order", formData.get("sort_order") as string || "0");
            fd.append("is_visible", formData.get("is_visible") === "on" ? "true" : "false");
            fd.append("cta_text", formData.get("cta_text") as string || "");
            fd.append("cta_link", formData.get("cta_link") as string || "");

            if (selectedFile && selectedFile.size > 0) {
                fd.append("image", selectedFile);
            }

            if (editingPromo) {
                await updatePromotion(editingPromo.id, fd, token);
                setSuccess("Campaign banner updated!");
            } else {
                await createPromotion(fd, token);
                setSuccess("New campaign banner launched!");
            }

            closeForm();
            loadData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error("Save Error:", err);
            setError(err.message || "Failed to save banner.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!token || !confirm("Delete this campaign banner?")) return;
        try {
            await deletePromotion(id, token);
            setSuccess("Banner removed.");
            loadData();
        } catch { setError("Failed to delete."); }
    };

    const handleToggleVisibility = async (promo: Promotion) => {
        if (!token) return;
        try {
            await updatePromotion(promo.id, { is_visible: !promo.is_visible }, token);
            loadData();
        } catch { setError("Failed to update visibility."); }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Header */}
            <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-fuchsia-100 rounded-3xl">
                        <Sparkles className="w-8 h-8 text-fuchsia-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campaign Banners</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Manage hero promotions and storefront campaign banners.
                        </p>
                    </div>
                </div>
                {!isCreating && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 py-4 px-8 rounded-2xl bg-fuchsia-600 text-white text-xs uppercase font-black tracking-widest hover:bg-fuchsia-700 transition shadow-lg shadow-fuchsia-100"
                    >
                        <Plus className="w-4 h-4" /> New Campaign →
                    </button>
                )}
            </div>

            {/* Create / Edit Form */}
            {isCreating && (
                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black text-slate-900">
                            {editingPromo ? "Edit Campaign" : "Design New Campaign"}
                        </h2>
                        <button onClick={closeForm} className="p-3 rounded-full hover:bg-slate-50 text-slate-400 transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left: Text Fields */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Campaign Title</label>
                                <input
                                    name="title"
                                    defaultValue={editingPromo?.title}
                                    required
                                    placeholder="e.g. SUMMER BLOOMS ARE NEAR"
                                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-fuchsia-50 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Description / Lead Line</label>
                                <textarea
                                    name="description"
                                    defaultValue={editingPromo?.description}
                                    placeholder="Light fabrics. Fresh prints. New arrivals"
                                    rows={3}
                                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-fuchsia-50 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Button Text</label>
                                    <input
                                        name="cta_text"
                                        defaultValue={editingPromo?.cta_text || "Discover Now"}
                                        className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Redirect URL</label>
                                    <input
                                        name="cta_link"
                                        defaultValue={editingPromo?.cta_link || ""}
                                        placeholder="/collections/new-arrivals"
                                        className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Sort Order</label>
                                    <input
                                        name="sort_order"
                                        type="number"
                                        defaultValue={editingPromo?.sort_order ?? 0}
                                        className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col justify-end space-y-2">
                                    <label className="flex items-center gap-3 cursor-pointer p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition">
                                        <input
                                            name="is_visible"
                                            type="checkbox"
                                            defaultChecked={editingPromo?.is_visible ?? true}
                                            className="w-4 h-4 accent-emerald-500"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Visible on Store</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Right: Image */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-1">Campaign Visual (High-Res Image)</label>
                                <div className="aspect-[4/3] rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden relative group">
                                    {(previewUrl || editingPromo?.image) ? (
                                        <img
                                            src={previewUrl || getMediaUrl(editingPromo?.image)}
                                            className="w-full h-full object-cover"
                                            alt="Preview"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                            <ImageIcon className="w-12 h-12 mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No Image Selected</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="px-6 py-3 bg-white rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition">
                                            {previewUrl || editingPromo?.image ? "Change Image" : "Upload Image"}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setSelectedFile(file);
                                                        setPreviewUrl(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-3 text-center">Recommended: 1920×1080px or higher</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-6 rounded-[2rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
                            >
                                {isSaving ? "Finalizing Campaign..." : editingPromo ? "Update Live Banner →" : "Launch Campaign Banner →"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Promotions Grid */}
            {!isCreating && (
                <div className="grid gap-8">
                    {promotions.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
                            <ImageIcon className="w-16 h-16 mx-auto text-slate-100 mb-6" />
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No Active Campaigns</h3>
                            <p className="text-sm text-slate-400 font-medium mt-2">Create your first hero banner to engage customers.</p>
                            <button
                                onClick={openCreate}
                                className="mt-8 px-10 py-4 rounded-2xl bg-fuchsia-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-700 transition"
                            >
                                <Plus className="w-3 h-3 inline mr-2" /> New Campaign
                            </button>
                        </div>
                    ) : (
                        promotions.map((promo) => (
                            <div key={promo.id} className="group relative bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                                <div className="grid lg:grid-cols-5 h-[280px]">
                                    <div className="lg:col-span-2 relative overflow-hidden bg-slate-100">
                                        {promo.image ? (
                                            <img
                                                src={getMediaUrl(promo.image)}
                                                className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                                                alt={promo.title}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-slate-200" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                                    </div>
                                    <div className="lg:col-span-3 p-10 flex flex-col justify-center relative">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${promo.is_visible ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                                {promo.is_visible ? "● Live" : "○ Hidden"}
                                            </span>
                                            <span className="px-3 py-1 bg-fuchsia-50 text-fuchsia-600 rounded-full text-[9px] font-black uppercase tracking-widest">Campaign</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 mb-2">{promo.title}</h3>
                                        {promo.description && (
                                            <p className="text-sm font-medium text-slate-400 line-clamp-2">{promo.description}</p>
                                        )}

                                        <div className="absolute top-8 right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={() => handleToggleVisibility(promo)}
                                                className="p-3 bg-white border border-slate-100 hover:border-emerald-200 text-slate-400 hover:text-emerald-600 rounded-2xl transition shadow-sm"
                                                title={promo.is_visible ? "Hide" : "Show"}
                                            >
                                                {promo.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => openEdit(promo)}
                                                className="p-3 bg-white border border-slate-100 hover:border-amber-200 text-slate-400 hover:text-amber-600 rounded-2xl transition shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(promo.id)}
                                                className="p-3 bg-white border border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-2xl transition shadow-sm"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="mt-6 flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <MoveUp className="w-3 h-3" />
                                                Order: {promo.sort_order}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
