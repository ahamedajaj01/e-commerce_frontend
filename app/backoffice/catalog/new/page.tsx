"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { fetchBackofficeCategories, createProduct } from "@/lib/api/catalog";
import { Copy, Trash2 } from "lucide-react";
import type { Category } from "@/types/product";

// ─── Predefined option lists ─────────────────────────────────────────────────
const MATERIAL_OPTIONS = ["Georgette", "Cotton", "Silk", "Chiffon", "Linen", "Velvet", "Crepe", "Satin", "Organza", "Rayon", "Net", "Lycra"];
const SLEEVE_OPTIONS = ["Sleeveless", "Short Sleeve", "3/4 Sleeve", "Full Sleeve", "Flutter Sleeves", "Bell Sleeve", "Cap Sleeve", "Off-Shoulder"];
const LENGTH_OPTIONS = ["Under Bust", "Waist Length", "Hip Length", "Knee Length", "Midi", "Ankle Length", "Floor Length"];
const NECKLINE_OPTIONS = ["Round Neck", "V-Neck", "Square Neck", "Sweetheart", "Halter", "Boat Neck", "Collar", "Off-Shoulder"];
const FIT_OPTIONS = ["Regular", "Slim", "Relaxed", "Oversized", "Flared", "Bodycon", "A-Line"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];
const COLOR_OPTIONS = ["Red", "Blue", "Green", "Black", "White", "Pink", "Yellow", "Purple", "Orange", "Maroon", "Navy", "Beige", "Grey", "Multicolor"];

// ─── Types ────────────────────────────────────────────────────────────────────
interface VariantRow {
    id: string; // local key only
    sku: string;
    size: string;
    color: string;
    price: string;
    stock_quantity: string;
    is_unlimited_stock: boolean;
}

// ─── Combobox ─────────────────────────────────────────────────────────────────
function Combobox({
    name,
    label,
    options,
    placeholder,
}: {
    name: string;
    label: string;
    options: string[];
    placeholder?: string;
}) {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(false);
    const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

    return (
        <div className="space-y-2 relative">
            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">{label}</label>
            <input type="hidden" name={name} value={value} />
            <input
                value={value}
                onChange={(e) => { setValue(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder={placeholder || `Select or type ${label}...`}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden max-h-48 overflow-y-auto">
                    {filtered.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onMouseDown={() => { setValue(opt); setOpen(false); }}
                            className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 transition-colors"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Bulk Add Tool ────────────────────────────────────────────────────────────
function BulkAddTool({ onGenerate }: { onGenerate: (color: string, sizes: string[]) => void }) {
    const [color, setColor] = useState("");
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    const toggleSize = (s: string) => {
        setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const handleAdd = () => {
        if (!color || selectedSizes.length === 0) return;
        onGenerate(color, selectedSizes);
        setColor("");
        setSelectedSizes([]);
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Quick Bulk Add</h3>
                <span className="text-[9px] font-bold text-fuchsia-500 bg-fuchsia-50 px-2 py-1 rounded-md">PRO TIP</span>
            </div>
            <div className="grid gap-6 sm:grid-cols-12 items-end">
                <div className="sm:col-span-4 space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-1">Common Color</label>
                    <input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="e.g. Emerald Green"
                        className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
                    />
                </div>
                <div className="sm:col-span-6 space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-1">Select Sizes</label>
                    <div className="flex flex-wrap gap-2">
                        {SIZE_OPTIONS.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => toggleSize(s)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedSizes.includes(s)
                                    ? "bg-slate-900 text-white shadow-lg scale-105"
                                    : "bg-white border border-slate-200 text-slate-400 hover:border-slate-300"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!color || selectedSizes.length === 0}
                        className="w-full h-[47px] bg-white border-2 border-slate-950 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                    >
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
}
function VariantRowItem({
    row,
    index,
    onUpdate,
    onRemove,
    onDuplicate,
}: {
    row: VariantRow;
    index: number;
    onUpdate: (id: string, field: keyof VariantRow, value: string | boolean) => void;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
}) {
    return (
        <div className="grid grid-cols-12 gap-3 items-start p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-fuchsia-100 transition-colors">
            {/* Row number */}
            <div className="col-span-12 sm:col-span-1 flex items-center">
                <span className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                    {index + 1}
                </span>
            </div>

            {/* SKU */}
            <div className="col-span-12 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">SKU</label>
                <input
                    value={row.sku}
                    onChange={(e) => onUpdate(row.id, "sku", e.target.value)}
                    placeholder="e.g. SILK-RED-L"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10"
                />
            </div>

            {/* Size */}
            <div className="col-span-6 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">Size</label>
                <input
                    type="text"
                    value={row.size}
                    onChange={(e) => onUpdate(row.id, "size", e.target.value)}
                    placeholder="e.g. XL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10"
                />
            </div>

            {/* Color */}
            <div className="col-span-6 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">Color</label>
                <input
                    type="text"
                    value={row.color}
                    onChange={(e) => onUpdate(row.id, "color", e.target.value)}
                    placeholder="e.g. Ruby Red"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10"
                />
            </div>

            {/* Price */}
            <div className="col-span-6 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">Price (NPR)</label>
                <input
                    type="number"
                    min="0"
                    value={row.price}
                    onChange={(e) => onUpdate(row.id, "price", e.target.value)}
                    placeholder="2500"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10"
                />
            </div>

            {/* Stock / Unlimited toggle */}
            <div className="col-span-6 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">Stock</label>
                {row.is_unlimited_stock ? (
                    <div className="flex items-center h-9 px-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Unlimited</span>
                    </div>
                ) : (
                    <input
                        type="number"
                        min="0"
                        value={row.stock_quantity}
                        onChange={(e) => onUpdate(row.id, "stock_quantity", e.target.value)}
                        placeholder="50"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10"
                    />
                )}
            </div>

            {/* Controls */}
            <div className="col-span-12 sm:col-span-1 flex flex-col items-end gap-2 pt-1 border-l border-slate-200 pl-2">
                <button
                    type="button"
                    title="Duplicate this row"
                    onClick={() => onDuplicate(row.id)}
                    className="h-7 w-7 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
                    <Copy className="w-3 h-3" />
                </button>
                <button
                    type="button"
                    title={row.is_unlimited_stock ? "Switch to fixed stock" : "Set as unlimited"}
                    onClick={() => onUpdate(row.id, "is_unlimited_stock", !row.is_unlimited_stock)}
                    className={`h-7 w-7 rounded-full flex items-center justify-center border text-[9px] font-black transition-all ${row.is_unlimited_stock
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md font-sans"
                        : "bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500"
                        }`}>
                    ∞
                </button>
                <button type="button" onClick={() => onRemove(row.id)}
                    className="h-7 w-7 rounded-full flex items-center justify-center border border-slate-200 text-slate-300 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NewProductPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [variants, setVariants] = useState<VariantRow[]>([]);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!token) return;
        fetchBackofficeCategories(token).then((data: any) => {
            setCategories(Array.isArray(data) ? data : data?.results || []);
        }).catch(() => { });
    }, [token]);

    const addVariantRow = () => {
        setVariants((prev) => [
            ...prev,
            { id: crypto.randomUUID(), sku: "", size: "", color: "", price: "", stock_quantity: "", is_unlimited_stock: false },
        ]);
    };

    const generateSmartSKU = (name: string, size: string, color: string) => {
        const clean = (str: string) => str.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
        const p = clean(name || "PROD");
        const c = clean(color || "");
        const s = clean(size || "");

        let sku = p;
        if (c) sku += `-${c}`;
        if (s) sku += `-${s}`;
        return sku;
    };

    const updateVariant = (id: string, field: keyof VariantRow, value: string | boolean) => {
        setVariants((prev) => prev.map((v) => {
            if (v.id === id) {
                const updated = { ...v, [field]: value };
                // Smart SKU suggestion: If SKU is empty and we just updated size/color
                if (!updated.sku && (field === "size" || field === "color")) {
                    const productName = (document.getElementsByName("name")[0] as HTMLInputElement)?.value || "";
                    updated.sku = generateSmartSKU(productName, updated.size, updated.color);
                }
                return updated;
            }
            return v;
        }));
    };

    const bulkAddVariants = (color: string, selectedSizes: string[]) => {
        const productName = (document.getElementsByName("name")[0] as HTMLInputElement)?.value || "";
        const basePrice = (document.getElementsByName("base_price")[0] as HTMLInputElement)?.value || "";

        const newRows = selectedSizes.map(size => ({
            id: crypto.randomUUID(),
            color: color,
            size: size,
            price: basePrice,
            stock_quantity: "0",
            is_unlimited_stock: false,
            sku: generateSmartSKU(productName, size, color)
        }));

        setVariants(prev => [...prev, ...newRows]);
    };

    const duplicateVariant = (id: string) => {
        const source = variants.find(v => v.id === id);
        if (!source) return;
        setVariants([...variants, {
            ...source,
            id: crypto.randomUUID(),
            size: "",
            sku: ""
        }]);
    };

    const removeVariant = (id: string) => {
        setVariants((prev) => prev.filter((v) => v.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) return;

        const form = e.currentTarget;
        const raw = new FormData(form);

        // ── Validation ──────────────────────────────────────────────────────────
        const name = (raw.get("name") as string)?.trim();
        if (!name) { setErrorInfo("Please enter a Product Name before publishing."); return; }

        const basePrice = (raw.get("base_price") as string)?.trim();
        if (!basePrice) { setErrorInfo("Please enter a Base Price before publishing."); return; }

        if (variants.length > 0) {
            for (const v of variants) {
                if (!v.size || !v.color || !v.price) {
                    setErrorInfo("Each variant must have a Size, Color, and Price filled in.");
                    return;
                }
            }
        }

        setLoading(true);
        setErrorInfo(null);

        // ── Build payload ────────────────────────────────────────────────────────
        const payload = new FormData();
        payload.append("name", name);

        const description = (raw.get("description") as string)?.trim();
        if (description) payload.append("description", description);

        // Double mapping for backend safety (in case DB field is `price` instead of `base_price`)
        payload.append("base_price", basePrice);
        payload.append("price", basePrice);

        const category_id = raw.get("category_id") as string;
        if (category_id) payload.append("category_id", category_id);

        // Design attributes
        ["material", "sleeve", "length", "neck_line", "fit"].forEach((field) => {
            const val = (raw.get(field) as string)?.trim();
            if (val) payload.append(field, val);
        });

        // Visibility
        const isVisible = raw.get("is_visible") === "true";
        payload.append("is_visible", isVisible ? "true" : "false");

        // Main image
        if (imageFile) payload.append("image", imageFile);

        // Gallery images
        if (galleryFiles.length > 0) {
            galleryFiles.forEach(file => {
                payload.append("images", file);
            });
        }

        // Variants — serialized as JSON string per backend spec
        if (variants.length > 0) {
            const variantPayload = variants.map(({ id: _id, ...v }) => ({
                ...v,
                price: Number(v.price),
                stock_quantity: v.is_unlimited_stock ? 0 : Number(v.stock_quantity || 0),
            }));
            payload.append("variants", JSON.stringify(variantPayload));
        }

        try {
            await createProduct(payload, token);
            setSuccessInfo("Product published successfully!");
            setTimeout(() => router.push("/backoffice/catalog"), 1000);
        } catch (err: any) {
            setErrorInfo(err.message || "Something went wrong. Please check your inputs and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <AlertBanner message={errorInfo || ""} type="error" onClose={() => setErrorInfo(null)} />
            <AlertBanner message={successInfo || ""} type="success" onClose={() => setSuccessInfo(null)} />

            {/* ── Page Header ─────────────────────────────────────────────────── */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-[10px] uppercase tracking-widest font-black text-slate-400 hover:text-slate-900 transition flex items-center gap-2 mb-6"
                >
                    ← Back to Products
                </button>
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-fuchsia-600">Product Studio</p>
                <h1 className="mt-2 text-4xl font-black text-slate-900 leading-tight">Add New Product</h1>
                <p className="mt-3 text-sm font-medium text-slate-400 max-w-xl">
                    Fill in all the details below and hit <strong>Publish Product</strong> when ready.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">

                {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Essential Info */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Essential Information</h2>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                                Product Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                name="name"
                                required
                                type="text"
                                placeholder="e.g. Silk Wrap Dress"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Description</label>
                            <textarea
                                name="description"
                                rows={4}
                                placeholder="Describe the garment — styling, occasion, fit notes..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition resize-none"
                            />
                        </div>
                    </section>

                    {/* Fashion Design Attributes */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-black text-slate-900">Design Attributes</h2>
                            <p className="text-xs text-slate-400 font-medium mt-1">These power the storefront filters and reel-to-product linking.</p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Combobox name="material" label="Material" options={MATERIAL_OPTIONS} placeholder="e.g. Georgette" />
                            <Combobox name="sleeve" label="Sleeve Type" options={SLEEVE_OPTIONS} placeholder="e.g. Flutter Sleeves" />
                            <Combobox name="length" label="Length" options={LENGTH_OPTIONS} placeholder="e.g. Midi" />
                            <Combobox name="neck_line" label="Neck Line" options={NECKLINE_OPTIONS} placeholder="e.g. V-Neck" />
                            <Combobox name="fit" label="Fit" options={FIT_OPTIONS} placeholder="e.g. Regular" />
                        </div>
                    </section>

                    {/* Variants Matrix */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Size & Color Variants</h2>
                                <p className="text-xs text-slate-400 font-medium mt-1">Each row is a unique purchasable unit (e.g. Red / XL).</p>
                            </div>
                            <button
                                type="button"
                                onClick={addVariantRow}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-600 transition-colors"
                            >
                                <span className="text-lg leading-none">+</span> Add Row
                            </button>
                        </div>

                        <BulkAddTool onGenerate={bulkAddVariants} />

                        {variants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                                <span className="text-3xl opacity-20 mb-3">📦</span>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No variants yet</p>
                                <p className="text-xs text-slate-300 font-medium mt-1">Click "Add Row" to create your first size/color option.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {variants.map((v, i) => (
                                    <VariantRowItem
                                        key={v.id}
                                        row={v}
                                        index={i}
                                        onUpdate={updateVariant}
                                        onRemove={removeVariant}
                                        onDuplicate={duplicateVariant}
                                    />
                                ))}
                            </div>
                        )}

                        {variants.length > 0 && (
                            <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400 font-black">
                                <span className="text-emerald-500">∞</span> = Unlimited stock toggle per variant
                            </div>
                        )}
                    </section>
                </div>

                {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
                <div className="space-y-8">

                    {/* Image Upload */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Main Photo</h2>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative aspect-[3/4] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 hover:bg-slate-100 transition cursor-pointer overflow-hidden"
                        >
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-700"
                                    alt="Preview"
                                />
                            ) : (
                                <>
                                    <span className="text-4xl opacity-20 group-hover:scale-125 transition duration-500">🖼️</span>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Click to Upload</p>
                                    <p className="text-[9px] text-slate-300 font-medium">JPG, PNG, WEBP</p>
                                </>
                            )}
                            {imagePreview && (
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Photo</p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                            }}
                        />
                    </section>

                    {/* Gallery Photos */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Gallery Photos</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {galleryPreviews.map((preview, idx) => (
                                <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100">
                                    <img src={preview} className="h-full w-full object-cover" alt={`Gallery ${idx + 1}`} />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setGalleryFiles(prev => prev.filter((_, i) => i !== idx));
                                            setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/90 text-rose-500 font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <div
                                onClick={() => galleryInputRef.current?.click()}
                                className="group relative aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <span className="text-2xl opacity-20 group-hover:scale-110 transition duration-300">📸</span>
                                <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Add Photo</p>
                            </div>
                        </div>
                        <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (!e.target.files) return;
                                const files = Array.from(e.target.files);
                                setGalleryFiles(prev => [...prev, ...files]);
                                setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                            }}
                        />
                    </section>

                    {/* Classification */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Classification</h2>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Category</label>
                            <select
                                name="category_id"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
                            >
                                <option value="">Select a Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                                Base Price (NPR) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                name="base_price"
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                placeholder="e.g. 2500"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Used as the display price. Individual variant prices override this.</p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Store Visibility</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Toggle to hide this from the main catalog.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="is_visible" defaultChecked className="sr-only peer" value="true" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    </section>

                    {/* Publish */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-5">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 text-[10px] uppercase tracking-widest font-black h-auto"
                        >
                            {loading ? "Publishing..." : "Publish Product →"}
                        </Button>
                        <p className="text-center text-[9px] text-slate-400 font-medium leading-relaxed">
                            This will immediately make the product visible to storefront customers.
                        </p>
                    </section>
                </div>

            </form>
        </div>
    );
}
