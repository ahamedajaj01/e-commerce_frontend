"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficeBrands,
    createBrand,
    deleteBrand
} from "@/lib/api/catalog";
import type { Brand } from "@/types/product";
import { PageHeader } from "@/components/backoffice/PageHeader";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Trash2, Plus, Image as ImageIcon, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function BrandsPage() {
    const { token, isAuthenticated } = useAuth();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // New Brand Form State
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
        } catch (err) {
            setError("Failed to load brands.");
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
        setError(null);

        const payload = new FormData();
        payload.append("name", newName);
        if (newDesc) payload.append("description", newDesc);
        if (imageFile) payload.append("logo", imageFile);

        try {
            await createBrand(payload, token);
            setSuccess("Brand created successfully.");
            setNewName("");
            setNewDesc("");
            setImageFile(null);
            setImagePreview(null);
            setShowForm(false);
            load();
        } catch (err: any) {
            setError(err.message || "Failed to create brand.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!token || !confirm(`Are you sure you want to delete ${name}? This may affect products linked to this brand.`)) return;

        try {
            await deleteBrand(id, token);
            setSuccess("Brand deleted.");
            load();
        } catch {
            setError("Could not delete brand.");
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            <PageHeader
                title="Brand Management"
                subtitle="Curate and manage global brand identities for your product catalog."
                category="Commercial Domain"
                breadcrumbs={[{ label: "Catalog" }, { label: "Brands" }]}
                actions={
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-4 text-[10px] uppercase tracking-widest font-black h-auto bg-slate-900 hover:bg-fuchsia-600 border-none shadow-xl shadow-slate-200"
                    >
                        {showForm ? "Close Form" : "Create Brand +"}
                    </Button>
                }
            />

            <div className="grid grid-cols-12 gap-10">
                {/* Left: Brand Creator Form */}
                {showForm && (
                    <div className="col-span-12 lg:col-span-4 animate-in slide-in-from-left-4 duration-500">
                        <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl shadow-slate-200/50 sticky top-10">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Brand Architect</h2>

                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Brand Name</label>
                                    <input
                                        required
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Nike, Zara, Lyra"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Description</label>
                                    <textarea
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        rows={3}
                                        placeholder="Heritage and mission statement..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-950 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-1">Brand Identity (Logo)</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-100 transition group overflow-hidden"
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} className="absolute inset-0 w-full h-full object-contain p-4 transition duration-500 group-hover:scale-110" />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-8 h-8 text-slate-300" />
                                                <p className="text-[9px] font-black uppercase text-slate-400">Upload Vector/PNG</p>
                                            </>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setImageFile(file);
                                                    setImagePreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    disabled={isSaving}
                                    className="w-full py-5 text-[10px] font-black uppercase tracking-[0.2em] h-auto shadow-lg shadow-fuchsia-100"
                                >
                                    {isSaving ? "Synchronizing..." : "Register Brand"}
                                </Button>
                            </form>
                        </section>
                    </div>
                )}

                {/* Right: Brand Registry List */}
                <div className={showForm ? "col-span-12 lg:col-span-8" : "col-span-12"}>
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden min-h-[600px]">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Registry</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total Verified Entities: {brands.length}</p>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Authorized Catalog
                            </div>
                        </div>

                        <div className="p-4">
                            {isLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                                    <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Loading Registry...</p>
                                </div>
                            ) : brands.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ImageIcon className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Registry is Empty</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">Configure your brand library to power high-scale campaign targeting.</p>
                                    {!showForm && (
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="mt-8 text-[10px] font-black uppercase text-fuchsia-600 hover:text-fuchsia-700 transition"
                                        >
                                            Inaugurate First Brand →
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-6">
                                    {brands.map((brand) => (
                                        <div
                                            key={brand.id}
                                            className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:border-slate-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                                        >
                                            <div className="flex flex-col items-center text-center">
                                                <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 mb-6 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 duration-700">
                                                    {brand.logo ? (
                                                        <img src={brand.logo} className="w-full h-full object-contain p-2" />
                                                    ) : (
                                                        <span className="text-2xl font-black text-slate-200">{brand.name.charAt(0)}</span>
                                                    )}
                                                </div>

                                                <h4 className="text-base font-black text-slate-950 uppercase tracking-tight">{brand.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4 flex items-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-slate-200" /> Verified Brand
                                                </p>

                                                <div className="w-full pt-6 mt-4 border-t border-slate-50 flex items-center justify-center gap-4">
                                                    <button
                                                        onClick={() => handleDelete(brand.id, brand.name)}
                                                        className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    <div className="h-4 w-px bg-slate-50 opacity-0 group-hover:opacity-100" />

                                                    <Link
                                                        href={`/backoffice/catalog?brand=${brand.id}`}
                                                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all text-[9px] font-black uppercase tracking-widest"
                                                    >
                                                        Products <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in duration-1000">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="max-w-md">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Strategic Integration</h3>
                                <p className="text-lg font-bold text-white tracking-tight leading-snug">
                                    Brands defined here become instantly available as filters in the <span className="text-fuchsia-400">Sale Campaign Studio</span> for mass-product linking.
                                </p>
                            </div>
                            <div className="hidden md:block">
                                <div className="h-16 w-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl rotate-12">
                                    💎
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
