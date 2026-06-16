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
    Camera,
    ChevronLeft,
    Check,
    Layers,
    Tag,
    Workflow,
    ArrowRight,
    Zap,
    Loader2
} from "lucide-react";
import type { Category, Brand } from "@/types/product";

// ─── Predefined options ──────────────────────────────────────────────────────
const MATERIAL_OPTIONS = ["Georgette", "Cotton", "Silk", "Chiffon", "Linen", "Velvet", "Crepe", "Satin", "Organza", "Rayon", "Net", "Lycra"];
const SLEEVE_OPTIONS = ["Sleeveless", "Short Sleeve", "3/4 Sleeve", "Full Sleeve", "Flutter Sleeves", "Bell Sleeve", "Cap Sleeve", "Off-Shoulder"];
const LENGTH_OPTIONS = ["Under Bust", "Waist Length", "Hip Length", "Knee Length", "Midi", "Ankle Length", "Floor Length"];
const NECKLINE_OPTIONS = ["Round Neck", "V-Neck", "Square Neck", "Sweetheart", "Halter", "Boat Neck", "Collar", "Off-Shoulder"];
const FIT_OPTIONS = ["Regular", "Slim", "Relaxed", "Oversized", "Flared", "Bodycon", "A-Line"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];

interface VariantRow {
    id: string;
    sku: string;
    size: string;
    color: string;
    price: string;
    stock_quantity: string;
    is_unlimited_stock: boolean;
}

// ─── Precision Combobox ──────────────────────────────────────────────────────
function Combobox({ name, label, options, placeholder }: { name: string; label: string; options: string[]; placeholder?: string }) {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(false);
    const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

    return (
        <div className="space-y-1 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</label>
            <input type="hidden" name={name} value={value} />
            <input
                value={value}
                onChange={(e) => { setValue(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                placeholder={placeholder || `Select or type...`}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-[12px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-all placeholder:text-slate-300 h-9"
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-xl overflow-hidden max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                    {filtered.map((opt) => (
                        <button key={opt} type="button" onMouseDown={() => { setValue(opt); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                            {opt}
                        </button>
                    ))}
                </div>
            )}
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

    // Bulk Tool State
    const [bulkColor, setBulkColor] = useState("");
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

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
        setVariants([...variants, { id: crypto.randomUUID(), sku: "", size: "", color: "", price: "", stock_quantity: "0", is_unlimited_stock: false }]);
    };

    const generateSmartSKU = (name: string, size: string, color: string) => {
        const clean = (str: string) => str.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
        const p = clean(name || "PROD");
        const c = clean(color || "");
        const s = clean(size || "");
        return `${p}${c ? '-' + c : ''}${s ? '-' + s : ''}`;
    };

    const updateVariant = (id: string, field: keyof VariantRow, value: string | boolean) => {
        setVariants(variants.map(v => {
            if (v.id === id) {
                const updated = { ...v, [field]: value };
                if (!updated.sku && (field === "size" || field === "color")) {
                    const prodName = (document.getElementsByName("name")[0] as HTMLInputElement)?.value || "";
                    updated.sku = generateSmartSKU(prodName, updated.size, updated.color);
                }
                return updated;
            }
            return v;
        }));
    };

    const bulkAddVariants = () => {
        if (!bulkColor || selectedSizes.length === 0) return;
        const prodName = (document.getElementsByName("name")[0] as HTMLInputElement)?.value || "";
        const basePrice = (document.getElementsByName("base_price")[0] as HTMLInputElement)?.value || "";
        const newRows = selectedSizes.map(size => ({
            id: crypto.randomUUID(),
            sku: generateSmartSKU(prodName, size, bulkColor),
            size, color: bulkColor, price: basePrice, stock_quantity: "0", is_unlimited_stock: false
        }));
        setVariants([...variants, ...newRows]);
        setBulkColor(""); setSelectedSizes([]);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const payload = new FormData();
        payload.append("name", formData.get("name") as string);
        payload.append("description", formData.get("description") as string || "");
        payload.append("base_price", formData.get("base_price") as string);
        payload.append("price", formData.get("base_price") as string);
        payload.append("category_id", formData.get("category_id") as string);
        const brandId = formData.get("brand_id") as string;
        if (brandId && brandId !== "") {
            payload.append("brand_id", brandId);
        }
        payload.append("is_visible", formData.get("is_visible") === "on" ? "true" : "false");

        ["material", "sleeve", "length", "neck_line", "fit"].forEach(f => {
            const v = formData.get(f) as string;
            if (v) payload.append(f, v);
        });

        if (imageFile) payload.append("image", imageFile);
        galleryFiles.forEach(f => payload.append("images", f));
        if (variants.length > 0) {
            const vPayload = variants.map(({ id: _, ...v }) => ({ ...v, price: Number(v.price), stock_quantity: v.is_unlimited_stock ? 0 : Number(v.stock_quantity || 0) }));
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
        <div className="max-w-[1400px] mx-auto py-8 px-8 space-y-10 animate-in fade-in duration-500 pb-24">
            <AlertBanner message={errorInfo || ""} type="error" onClose={() => setErrorInfo(null)} />
            {successInfo && <AlertBanner message={successInfo} type="success" onClose={() => setSuccessInfo(null)} />}

            {/* HEADER */}
            <div className="flex items-end justify-between border-b pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-900 transition"><ChevronLeft className="w-5 h-5" /></button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catalog Registry</span>
                        <ArrowRight className="w-3 h-3 text-slate-200" />
                        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">New Production Item</span>
                    </div>
                    <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">Create Technical Item</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Define commercial parameters and technical variants for storefront publication.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-10">
                {/* MAIN CONTENT */}
                <div className="col-span-8 space-y-12">

                    {/* IDENTITY & ATTRIBUTES */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2.5">
                            <Tag className="w-4 h-4 text-slate-400" />
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Product Identity</h2>
                        </div>
                        <div className="bg-white border rounded-md p-8 space-y-6 shadow-sm">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Full Product Title</label>
                                <input name="name" required placeholder="Enter product name..." className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[14px] font-bold text-slate-900 outline-none focus:border-slate-900 h-10 transition-all" />
                            </div>
                            <div className="space-y-1.5 pt-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Production Description</label>
                                <textarea name="description" rows={4} placeholder="Describe construction and fit details..." className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-[13px] font-medium outline-none focus:border-slate-900 resize-none transition-all" />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 pt-5 border-t border-slate-100">
                                <Combobox name="material" label="Fabric / Material" options={MATERIAL_OPTIONS} />
                                <Combobox name="sleeve" label="Sleeve Type" options={SLEEVE_OPTIONS} />
                                <Combobox name="length" label="Garment Length" options={LENGTH_OPTIONS} />
                                <Combobox name="neck_line" label="Neckline Style" options={NECKLINE_OPTIONS} />
                                <Combobox name="fit" label="Intended Fit" options={FIT_OPTIONS} />
                            </div>
                        </div>
                    </section>

                    {/* VARIANT GENERATOR & MATRIX */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Zap className="w-4 h-4 text-emerald-500" />
                                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Inventory Variants</h2>
                            </div>
                            <button type="button" onClick={addVariantRow} className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Add Manual Row</button>
                        </div>

                        {/* BULK ADD BAR */}
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-5 flex items-center gap-6 shadow-sm">
                            <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Matrix Color</label>
                                <input value={bulkColor} onChange={e => setBulkColor(e.target.value)} placeholder="e.g. Ruby Red" className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-[11px] font-bold outline-none focus:border-emerald-500 h-9" />
                            </div>
                            <div className="flex-[2] space-y-1">
                                <label className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Target Sizes</label>
                                <div className="flex gap-1.5">
                                    {SIZE_OPTIONS.map(s => (
                                        <button
                                            key={s} type="button"
                                            onClick={() => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                            className={`px-2.5 py-1.5 rounded text-[10px] font-bold transition-all border ${selectedSizes.includes(s) ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="button" onClick={bulkAddVariants} disabled={!bulkColor || selectedSizes.length === 0} className="h-9 bg-emerald-600 text-white px-5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-30 transition-all self-end">Generate</button>
                        </div>

                        {/* DATA GRID */}
                        <div className="bg-white border rounded-md shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="bg-slate-50 border-b">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[25%] text-left">Technical SKU</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[12%] text-left">Size</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[18%] text-left">Color</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[18%] text-left">Price (NPR)</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[17%] text-left">Stock Qty</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[10%] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {variants.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-20 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">No matrix entries defined.</td></tr>
                                    ) : (
                                        variants.map((v) => (
                                            <tr key={v.id} className="hover:bg-slate-50/40 transition-colors h-14">
                                                <td className="px-3"><input value={v.sku} onChange={e => updateVariant(v.id, "sku", e.target.value)} placeholder="SKU-..." className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-[11px] font-bold outline-none focus:border-slate-900 h-9" /></td>
                                                <td className="px-3"><input value={v.size} onChange={e => updateVariant(v.id, "size", e.target.value)} placeholder="..." className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[11px] font-bold outline-none focus:border-slate-900 h-9" /></td>
                                                <td className="px-3"><input value={v.color} onChange={e => updateVariant(v.id, "color", e.target.value)} placeholder="..." className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[11px] font-bold outline-none focus:border-slate-900 h-9" /></td>
                                                <td className="px-3"><input type="number" value={v.price} onChange={e => updateVariant(v.id, "price", e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-[11px] font-bold outline-none focus:border-slate-900 h-9" /></td>
                                                <td className="px-3">
                                                    <div className="flex items-center gap-1.5 h-9">
                                                        <input type="number" disabled={v.is_unlimited_stock} value={v.stock_quantity} onChange={e => updateVariant(v.id, "stock_quantity", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-[11px] font-bold outline-none disabled:opacity-20 h-full" />
                                                        <button type="button" onClick={() => updateVariant(v.id, "is_unlimited_stock", !v.is_unlimited_stock)} className={`w-8 h-8 shrink-0 rounded border flex items-center justify-center transition-all ${v.is_unlimited_stock ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'text-slate-300 border-slate-100'}`}><span className="text-[10px] font-black">∞</span></button>
                                                    </div>
                                                </td>
                                                <td className="px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button type="button" onClick={() => setVariants([...variants, { ...v, id: crypto.randomUUID(), sku: "" }])} className="text-slate-300 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded transition-all"><Copy className="w-3.5 h-3.5" /></button>
                                                        <button type="button" onClick={() => setVariants(variants.filter(x => x.id !== v.id))} className="text-slate-200 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* SIDEBAR BARK */}
                <div className="col-span-4 space-y-12">
                    {/* PRODUCTION ASSETS */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2.5">
                            <Camera className="w-4 h-4 text-slate-400" />
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Asset Workbench</h2>
                        </div>
                        <div className="bg-white border rounded-md p-6 space-y-6 shadow-sm">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Primary Product Creative</label>
                                <div onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] rounded border-2 border-dashed bg-slate-50 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-slate-300 transition-all duration-300 shadow-inner">
                                    {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <div className="text-center"><ImageIcon className="w-6 h-6 mx-auto text-slate-200 mb-2" /><p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Upload Portrait</p></div>}
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Carousel Gallery</label>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {galleryPreviews.slice(0, 5).map((p, i) => <div key={i} className="aspect-square rounded border bg-slate-50 overflow-hidden"><img src={p} className="w-full h-full object-cover" /></div>)}
                                    <div onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded border-2 border-dashed bg-slate-200/40 flex items-center justify-center cursor-pointer hover:border-slate-300 hover:bg-white transition-all text-slate-300"><Plus className="w-4 h-4" /></div>
                                    <input ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => { const fs = Array.from(e.target.files || []); setGalleryFiles([...galleryFiles, ...fs]); setGalleryPreviews([...galleryPreviews, ...fs.map(f => URL.createObjectURL(f))]); }} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* COMMERCIAL CONTROLS */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2.5">
                            <Layers className="w-4 h-4 text-slate-400" />
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Commercial Controls</h2>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-8 shadow-sm space-y-8 ring-1 ring-slate-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Standard Base Price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold border-r pr-3">NPR</span>
                                    <input name="base_price" required type="number" placeholder="0.00" className="w-full bg-white border border-slate-200 rounded px-16 py-3.5 text-[18px] font-black text-slate-950 outline-none focus:border-slate-900 transition-all shadow-sm" />
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-200">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storefront Category</label>
                                    <select name="category_id" required className="w-full bg-white border border-slate-200 rounded px-3 py-2.5 text-[12px] font-bold text-slate-900 outline-none cursor-pointer hover:border-slate-900 transition-all appearance-none shadow-sm">
                                        <option value="">Select Assignment...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand Registry</label>
                                    <select name="brand_id" className="w-full bg-white border border-slate-200 rounded px-3 py-2.5 text-[12px] font-bold text-slate-900 outline-none cursor-pointer hover:border-slate-900 transition-all appearance-none shadow-sm">
                                        <option value="">Private Label / No Brand</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[11px] font-black text-slate-900 tracking-tight leading-none uppercase">Public Storefront</span>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Sync live on publish</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="is_visible" defaultChecked className="sr-only peer" />
                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-emerald-500 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-950 text-white py-4 rounded font-black text-[12px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xl shadow-slate-200"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {loading ? 'PUBLISHING...' : 'PUBLISH PRODUCT →'}
                            </button>
                        </div>
                    </section>
                </div>
            </form>
        </div>
    );
}
