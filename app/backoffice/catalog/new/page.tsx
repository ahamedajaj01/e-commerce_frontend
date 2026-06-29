"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { fetchBackofficeCategories, createProduct, fetchBackofficeBrands } from "@/lib/api/catalog";
import {
    Plus,
    Trash2,
    Copy,
    Image as ImageIcon,
    ChevronLeft,
    Check,
    Truck,
    Tag,
    Layers,
    ArrowRight,
    Zap,
    Loader2,
    Save,
    ShieldCheck,
    Box,
    Info,
    LayoutGrid,
    X
} from "lucide-react";
import type { Category, Brand } from "@/types/product";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────
interface VariantRow {
    id: string;
    sku: string;
    label: string; // size
    variation: string; // name
    price: string;
    stock_quantity: string;
    is_unlimited_stock: boolean;
    image_id?: string;
}

// ─── Compact Components ──────────────────────────────────────────────────────
function Section({ title, description, children, icon: Icon, actions }: { title: string; description?: string; children: React.ReactNode; icon?: any; actions?: React.ReactNode }) {
    return (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-600">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">{title}</h2>
                        {description && <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">{description}</p>}
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            <div className="p-8">
                {children}
            </div>
        </section>
    );
}

function TextInput({ name, label, placeholder, defaultValue, type = "text", required = false, value, onChange }: {
    name: string; label: string; placeholder?: string; defaultValue?: string; type?: string; required?: boolean; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div className="group space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1 group-focus-within:text-blue-600 transition-colors">{label}</label>
            <input
                name={name}
                type={type}
                required={required}
                defaultValue={defaultValue}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm group-hover:border-slate-300"
            />
        </div>
    );
}

export default function NewProductPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [variants, setVariants] = useState<VariantRow[]>([]);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<string | null>(null);
    const [slug, setSlug] = useState("");

    // Bulk Tool State
    const [bulkVariation, setBulkVariation] = useState("");
    const [bulkScalesString, setBulkScalesString] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const generateSlug = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')   // Remove all non-word chars
            .replace(/--+/g, '-');      // Replace multiple - with single -
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSlug(generateSlug(val));
    };

    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetchBackofficeCategories(token),
            fetchBackofficeBrands(token)
        ]).then(([catData, brandData]: [any, any]) => {
            setCategories(Array.isArray(catData) ? catData : catData?.results || []);
            setBrands(Array.isArray(brandData) ? brandData : brandData?.results || []);
        });
    }, [token]);

    const addVariantRow = () => {
        setVariants([...variants, { id: crypto.randomUUID(), sku: "", label: "", variation: "", price: "", stock_quantity: "0", is_unlimited_stock: false }]);
    };

    const generateSmartSKU = (name: string, label: string, variation: string) => {
        const clean = (str: string) => str.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
        const p = clean(name || "PROD");
        const v = clean(variation || "");
        const l = clean(label || "");
        return `${p}${v ? '-' + v : ''}${l ? '-' + l : ''}`;
    };

    const updateVariant = (id: string, field: keyof VariantRow, value: string | boolean) => {
        setVariants(variants.map(v => {
            if (v.id === id) {
                const updated = { ...v, [field]: value };
                if (!updated.sku && (field === "label" || field === "variation")) {
                    const prodName = (document.getElementsByName("name")[0] as HTMLInputElement)?.value || "";
                    updated.sku = generateSmartSKU(prodName, updated.label, updated.variation);
                }
                return updated;
            }
            return v;
        }));
    };

    const bulkAddVariants = () => {
        const scales = bulkScalesString.split(",").map(s => s.trim()).filter(s => s !== "");
        if (!bulkVariation || scales.length === 0) return;

        const prodName = (document.getElementsByName("name")[0] as HTMLInputElement)?.value || "";
        const basePrice = (document.getElementsByName("base_price")[0] as HTMLInputElement)?.value || "";

        const newRows = scales.map(scale => ({
            id: crypto.randomUUID(),
            sku: generateSmartSKU(prodName, scale, bulkVariation),
            label: scale, variation: bulkVariation, price: basePrice, stock_quantity: "0", is_unlimited_stock: false
        }));
        setVariants([...variants, ...newRows]);
        setBulkVariation("");
        setBulkScalesString("");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const payload = new FormData();

        ["name", "slug", "description", "base_price", "category_id", "brand_id"].forEach(f => {
            const v = formData.get(f) as string;
            if (v) payload.append(f, v);
        });
        payload.append("price", formData.get("base_price") as string);
        const brandId = formData.get("brand_id") as string;
        if (brandId) payload.append("brand_id", brandId);
        payload.append("is_visible", formData.get("is_visible") === "on" ? "true" : "false");

        ["material", "sleeve", "length", "neck_line", "fit", "processing_days_min", "processing_days_max"].forEach(f => {
            const v = formData.get(f) as string;
            if (v) payload.append(f, v);
        });

        if (imageFile) payload.append("image", imageFile);
        galleryFiles.forEach(f => payload.append("images", f));

        if (variants.length > 0) {
            const vPayload = variants.map(({ id: _, label, variation, image_id, ...v }) => ({
                ...v,
                size: label,
                name: variation,
                image_id: image_id || null,
                image: image_id || null,
                price: Number(v.price),
                stock_quantity: v.is_unlimited_stock ? 0 : Number(v.stock_quantity || 0)
            }));
            payload.append("variants", JSON.stringify(vPayload));
        }

        try {
            await createProduct(payload, token);
            setSuccessInfo("Product synchronized successfully.");
            setTimeout(() => router.push("/backoffice/catalog"), 1000);
        } catch (err: any) {
            setErrorInfo(err.message || "Publication failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen">
            <div className="max-w-[1280px] mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Header Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-8 mb-8 bg-slate-50/30 -mx-10 px-10 pt-4">
                        <div className="space-y-1">
                            <button type="button" onClick={() => router.back()} className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest mb-3 group">
                                <div className="p-1 rounded bg-white shadow-sm border border-slate-200 group-hover:border-slate-300 transition-all">
                                    <ChevronLeft className="w-3 h-3" />
                                </div>
                                Catalog Registry
                            </button>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                                Create Technical Item
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-[10px] font-black text-slate-400 rounded-lg uppercase tracking-widest shadow-sm self-center mt-1">
                                    Draft Storefront
                                </div>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-slate-900 hover:bg-black text-white px-8 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {loading ? "Synchronizing..." : "Finalize Publication"}
                            </button>
                        </div>
                    </div>

                    <div className="max-w-[1000px] mx-auto space-y-6">
                        {/* Status Messages */}
                        <AlertBanner message={errorInfo || ""} type="error" onClose={() => setErrorInfo(null)} className="rounded-2xl h-auto py-3 px-4 text-xs font-medium" />
                        {successInfo && <AlertBanner message={successInfo} type="success" onClose={() => setSuccessInfo(null)} className="rounded-2xl h-auto py-3 px-4 text-xs font-medium" />}

                        {/* 1. PRODUCT MEDIA */}
                        <Section title="Product Media" icon={ImageIcon} description="Visual Assets Workflow">
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-[3/4] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white hover:border-blue-500 transition-all group overflow-hidden relative shadow-sm"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-sm group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master</span>
                                        </>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                                </div>

                                {galleryPreviews.map((p, idx) => (
                                    <div key={idx} className="aspect-[3/4] rounded-2xl overflow-hidden relative group border border-slate-200 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                                        <img src={p} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                                        <button
                                            type="button"
                                            onClick={() => { setGalleryPreviews(prev => prev.filter((_, i) => i !== idx)); setGalleryFiles(prev => prev.filter((_, i) => i !== idx)); }}
                                            className="absolute top-2 right-2 bg-white text-slate-900 rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <div
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="aspect-[3/4] rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-white hover:border-slate-400 transition-all group shadow-inner"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:bg-white transition-all shadow-sm">
                                        <Plus className="w-6 h-6 font-black" />
                                    </div>
                                    <input ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => { const fs = Array.from(e.target.files || []); setGalleryFiles([...galleryFiles, ...fs]); setGalleryPreviews([...galleryPreviews, ...fs.map(f => URL.createObjectURL(f))]); }} />
                                </div>
                            </div>
                        </Section>

                        {/* 2. ESSENTIAL INFORMATION */}
                        <Section title="Essential Information" icon={Info} description="Primary commercial identity">
                            <div className="space-y-6">
                                <div className="md:col-span-2">
                                    <TextInput name="name" label="PRODUCT NAME *" required placeholder="e.g. Kurti" onChange={handleNameChange} />
                                </div>
                                <TextInput name="slug" label="SLUG" placeholder="product-url-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                                <div className="group space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1 group-focus-within:text-blue-600 transition-colors">DESCRIPTION</label>
                                    <textarea name="description" rows={4} placeholder="Describe the item..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 border-neutral-200 transition-all shadow-sm resize-none group-hover:border-slate-300" />
                                </div>
                            </div>
                        </Section>

                        {/* 3. CLASSIFICATION */}
                        <Section title="Classification" icon={LayoutGrid} description="Categorization & Pricing Registry">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="group space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1 group-focus-within:text-blue-600 transition-colors">CATEGORY</label>
                                    <div className="relative">
                                        <select name="category_id" required className="w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer group-hover:border-slate-300">
                                            <option value="">Select Category...</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="group space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1 group-focus-within:text-blue-600 transition-colors">BRAND</label>
                                    <div className="relative">
                                        <select name="brand_id" className="w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer group-hover:border-slate-300">
                                            <option value="">No Brand / Private Label</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <TextInput name="base_price" label="BASE PRICE (NPR) *" required type="number" placeholder="0.00" />

                                <div className="pt-4 border-t border-slate-100 md:col-span-2 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">STORE VISIBILITY</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Toggle to hide this from the main catalog</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-110 origin-right">
                                        <input type="checkbox" name="is_visible" defaultChecked className="sr-only peer" />
                                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                    </label>
                                </div>
                            </div>
                        </Section>

                        {/* 3. INVENTORY MATRIX */}
                        <Section
                            title="Inventory Matrix"
                            icon={Box}
                            description="Stock Management & Variation Registry"
                            actions={
                                <button type="button" onClick={addVariantRow} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 shadow-slate-200">
                                    <Plus className="w-3.5 h-3.5" /> Manual Row
                                </button>
                            }
                        >
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 shadow-inner">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Bulk Variation Generator</label>
                                <div className="grid gap-4 sm:grid-cols-12 items-end">
                                    <div className="sm:col-span-4 space-y-2">
                                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Color / Style</label>
                                        <input value={bulkVariation} onChange={e => setBulkVariation(e.target.value)} placeholder="e.g. Forest Green" className="w-full bg-white border border-slate-200 rounded-xl px-4 h-10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm" />
                                    </div>
                                    <div className="sm:col-span-5 space-y-2">
                                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Target Sizes</label>
                                        <input value={bulkScalesString} onChange={e => setBulkScalesString(e.target.value)} placeholder="e.g. S, M, L, XL" className="w-full bg-white border border-slate-200 rounded-xl px-4 h-10 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm" />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <button type="button" onClick={bulkAddVariants} disabled={!bulkVariation || !bulkScalesString} className="w-full h-10 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all disabled:opacity-30 shadow-md">Generate matrix</button>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-[11px] border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest">
                                            <th className="px-5 py-4 text-left w-12 opacity-50">#</th>
                                            <th className="px-4 py-4 text-left w-24 opacity-50 text-[9px]">Slot</th>
                                            <th className="px-4 py-4 text-left">SKU</th>
                                            <th className="px-4 py-4 text-left w-20">LABEL / SIZE</th>
                                            <th className="px-4 py-4 text-left">VARIATION</th>
                                            <th className="px-4 py-4 text-left w-24">PRICE (NPR)</th>
                                            <th className="px-4 py-4 text-left w-28">STOCK QTY</th>
                                            <th className="px-5 py-4 text-right w-24 font-black">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-medium">
                                        {variants.length === 0 ? (
                                            <tr><td colSpan={8} className="px-6 py-20 text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">No matrix entries defined yet.</td></tr>
                                        ) : (
                                            variants.map((v, i) => (
                                                <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-4 text-slate-300 font-black">{i + 1}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center relative overflow-hidden group/img shadow-inner">
                                                            <ImageIcon className="w-4 h-4 text-slate-200" />
                                                            <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 text-white text-[7px] font-black text-center py-1 uppercase tracking-tighter translate-y-full group-hover/img:translate-y-0 transition-transform">Link Post-Save</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input value={v.sku} onChange={e => updateVariant(v.id, "sku", e.target.value)} className="w-full bg-transparent border-none p-0 font-bold text-slate-900 focus:ring-0 placeholder:text-slate-200" placeholder="SKU-..." />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input value={v.label} onChange={e => updateVariant(v.id, "label", e.target.value)} className="w-full bg-transparent border-none p-0 font-bold text-slate-900 focus:ring-0 placeholder:text-slate-200" placeholder="Size" />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input value={v.variation} onChange={e => updateVariant(v.id, "variation", e.target.value)} className="w-full bg-transparent border-none p-0 font-bold text-slate-900 focus:ring-0 placeholder:text-slate-200" placeholder="Style" />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-slate-300 font-bold">Rs.</span>
                                                            <input type="number" value={v.price} onChange={e => updateVariant(v.id, "price", e.target.value)} className="w-full bg-transparent border-none p-0 font-black text-slate-900 focus:ring-0" placeholder="0" />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {v.is_unlimited_stock ? (
                                                                <div className="flex-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter">Unlimited</div>
                                                            ) : (
                                                                <input type="number" value={v.stock_quantity} onChange={e => updateVariant(v.id, "stock_quantity", e.target.value)} className="w-full bg-transparent border-none p-0 font-bold text-slate-900 focus:ring-0" placeholder="0" />
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => updateVariant(v.id, "is_unlimited_stock", !v.is_unlimited_stock)}
                                                                className={`w-7 h-7 shrink-0 rounded-lg border flex items-center justify-center transition-all ${v.is_unlimited_stock ? 'bg-slate-900 border-slate-900 text-white' : 'text-slate-300 border-slate-200 hover:border-slate-400'}`}
                                                            >
                                                                <span className="text-xs font-black">∞</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button type="button" onClick={() => setVariants([...variants, { ...v, id: crypto.randomUUID(), sku: "" }])} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
                                                            <button type="button" onClick={() => setVariants(variants.filter(x => x.id !== v.id))} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        {/* 4. LOGISTICS & DESIGN ATTRIBUTES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Section title="Logistics" icon={Truck} description="Fulfillment Hub">
                                <div className="grid grid-cols-2 gap-6">
                                    <TextInput type="number" name="processing_days_min" label="MIN PROCESSING DAYS" placeholder="1" />
                                    <TextInput type="number" name="processing_days_max" label="MAX PROCESSING DAYS" placeholder="2" />
                                </div>
                            </Section>

                            <Section title="Design Attributes" icon={ShieldCheck} description="Storefront filters & linking">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <TextInput name="material" label="Primary Material" placeholder="e.g. Silk" />
                                    <TextInput name="sleeve" label="Primary Detail / Type" placeholder="e.g. Stylish" />
                                    <TextInput name="length" label="Secondary Detail" placeholder="e.g. Normal" />
                                    <TextInput name="neck_line" label="Styling / Connection" placeholder="e.g. Normal" />
                                    <div className="col-span-2">
                                        <TextInput name="fit" label="Standard Fit / Style" placeholder="e.g. Regular" />
                                    </div>
                                </div>
                            </Section>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
