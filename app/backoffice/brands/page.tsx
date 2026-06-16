"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficeBrands,
    createBrand,
    deleteBrand
} from "@/lib/api/catalog";
import type { Brand } from "@/types/product";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
    Trash2,
    Plus,
    Image as ImageIcon,
    ExternalLink,
    CheckCircle2,
    Search,
    X,
    Filter,
    Camera
} from "lucide-react";
import Link from "next/link";

export default function BrandsPage() {
    const { token, isAuthenticated } = useAuth();
    const { confirm } = useModal();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchBackofficeBrands(token);
            setBrands(Array.isArray(data) ? data : (data as any)?.results || []);
        } catch {
            setError("Failed to synchronize brand library.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) load();
    }, [token, isAuthenticated]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !newName) return;

        setIsSaving(true);
        const payload = new FormData();
        payload.append("name", newName);
        if (newDesc) payload.append("description", newDesc);
        if (imageFile) payload.append("logo", imageFile);

        try {
            await createBrand(payload, token);
            setSuccess("Brand registered successfully.");
            setNewName(""); setNewDesc("");
            setImageFile(null); setImagePreview(null);
            setShowForm(false);
            load();
        } catch {
            setError("Failed to register brand.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (!token) return;
        confirm({
            title: "Delete Brand?",
            description: `This action will permanently remove "${name}" and its primary metadata. It may affect filtering in the storefront catalog.`,
            confirmText: "Delete",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteBrand(id, token);
                    setSuccess("Brand removed.");
                    load();
                } catch { setError("Delete failed."); }
            }
        });
    };

    return (
        <div className="max-w-[1400px] mx-auto py-8 px-8 space-y-10 animate-in fade-in duration-300">
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* HEADER */}
            <div className="flex items-end justify-between border-b pb-6">
                <div className="space-y-1">
                    <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Brand Registry</h1>
                    <p className="text-sm text-slate-500 font-medium">Configure and manage global brand identities for the product catalog.</p>
                </div>
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" /> Register Brand
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* TABLE VIEW */}
                <div className={showForm ? "col-span-7 space-y-4" : "col-span-12 space-y-4"}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Entities</h2>
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            <input placeholder="Filter brands..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium w-48 outline-none" />
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b">
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Logo</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Brand Name</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Verification</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="px-6 py-20 text-center text-sm text-slate-400 font-medium">Syncing registry...</td></tr>
                                ) : brands.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-20 text-center text-sm text-slate-400 font-medium">No brand identities found.</td></tr>
                                ) : (
                                    brands.map((b) => (
                                        <tr key={b.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="w-10 h-10 rounded border bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                                                    {b.logo ? (
                                                        <img src={b.logo} className="w-full h-full object-contain p-1.5" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-200">{b.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[13px] font-bold text-slate-900">{b.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Link href={`/backoffice/catalog?brand=${b.id}`} className="text-[11px] font-bold text-slate-950 hover:underline flex items-center gap-1">Products <ExternalLink className="w-3 h-3" /></Link>
                                                    <button onClick={() => handleDelete(b.id, b.name)} className="text-[11px] font-bold text-rose-600 hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CREATION FORM AS SIDE PANEL */}
                {showForm && (
                    <div className="col-span-5 animate-in slide-in-from-right-4 duration-300">
                        <div className="sticky top-8 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">New Brand Profile</h2>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleCreate} className="bg-white border rounded-lg shadow-sm p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Brand Name</label>
                                        <input
                                            required value={newName} onChange={e => setNewName(e.target.value)}
                                            placeholder="e.g. Nike, Zara"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[13px] font-bold text-slate-900 outline-none focus:border-slate-950"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Description</label>
                                        <textarea
                                            value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}
                                            placeholder="Brief brand history..."
                                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-[13px] font-medium outline-none focus:border-slate-950 resize-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Brand Logo</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-video rounded-md border-2 border-dashed flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:border-slate-300 overflow-hidden relative group"
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} className="w-full h-full object-contain p-4 transition duration-500" />
                                            ) : (
                                                <div className="text-center">
                                                    <Camera className="w-6 h-6 mx-auto text-slate-200 mb-2" />
                                                    <p className="text-[10px] font-black uppercase text-slate-400">Upload Vector / PNG</p>
                                                </div>
                                            )}
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                                                onChange={e => {
                                                    const f = e.target.files?.[0];
                                                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    loading={isSaving}
                                    className="w-full"
                                >
                                    Register Brand
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
