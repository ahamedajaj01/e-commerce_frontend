"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { fetchBackofficeCategories, fetchBackofficeProducts, updateProduct } from "@/lib/api/catalog";
import { adjustInventory } from "@/lib/api/inventory";
import { getProductImage, getMediaUrl } from "@/lib/utils";
import type { Category, Product, ProductVariant } from "@/types/product";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Copy, Plus, X, Trash2 } from "lucide-react";

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
    id: string;
    backendId?: string;
    sku: string;
    size: string;
    color: string;
    price: string;
    stock_quantity: string;
    is_unlimited_stock: boolean;
}

// ─── Combobox ─────────────────────────────────────────────────────────────────
function Combobox({ name, label, options, placeholder, defaultValue }: {
    name: string; label: string; options: string[]; placeholder?: string; defaultValue?: string;
}) {
    const [value, setValue] = useState(defaultValue || "");
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
        // Reset for next use
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
function VariantRowItem({ row, index, onUpdate, onRemove, onDuplicate }: {
    row: VariantRow; index: number;
    onUpdate: (id: string, field: keyof VariantRow, value: string | boolean) => void;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
}) {
    return (
        <div className="grid grid-cols-12 gap-3 items-start p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-fuchsia-100 transition-colors">
            <div className="col-span-12 sm:col-span-1 flex items-center">
                <span className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{index + 1}</span>
            </div>
            <div className="col-span-12 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">SKU</label>
                <input value={row.sku} onChange={(e) => onUpdate(row.id, "sku", e.target.value)} placeholder="e.g. SILK-RED-L"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10" />
            </div>
            <div className="col-span-6 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">Size</label>
                <input type="text" value={row.size} onChange={(e) => onUpdate(row.id, "size", e.target.value)} placeholder="e.g. XL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10" />
            </div>
            <div className="col-span-6 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">Color</label>
                <input type="text" value={row.color} onChange={(e) => onUpdate(row.id, "color", e.target.value)} placeholder="e.g. Ruby Red"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10" />
            </div>
            <div className="col-span-6 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">Price (NPR)</label>
                <input type="number" min="0" value={row.price} onChange={(e) => onUpdate(row.id, "price", e.target.value)} placeholder="2500"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10" />
            </div>
            <div className="col-span-6 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-1">Stock Qty</label>
                {row.is_unlimited_stock ? (
                    <div className="flex items-center h-9 px-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Unlimited</span>
                    </div>
                ) : (
                    <input type="number" min="0" value={row.stock_quantity} onChange={(e) => onUpdate(row.id, "stock_quantity", e.target.value)} placeholder="50"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10" />
                )}
            </div>
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
export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [product, setProduct] = useState<Product | null>(null);
    const [mainImage, setMainImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [variants, setVariants] = useState<VariantRow[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<string | null>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    // Track original stock per backendId so we can compute correct delta on save
    const originalStockRef = useRef<Record<string, number>>({});

    const { token } = useAuth();

    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetchBackofficeCategories(token),
            fetchBackofficeProducts(token),
        ]).then(([catsData, productsData]) => {
            const catResults = Array.isArray(catsData) ? catsData : (catsData as any)?.results || [];
            setCategories(catResults);
            const allProducts: Product[] = Array.isArray(productsData) ? productsData : (productsData as any)?.results || [];
            const found = allProducts.find(p => p.id === id) || null;
            if (found) {
                setProduct(found);

                // Initialize main image
                setMainImage(getProductImage(found) || null);

                // Initialize existing gallery previews (all media objects excluding the first one used as main)
                if (found.media && found.media.length > 1) {
                    setGalleryPreviews(found.media.slice(1).map(m => m.file_url || getMediaUrl(m.file) || ""));
                }

                // Pre-populate variants from existing product data
                if (found.variants && found.variants.length > 0) {
                    const variantRows = found.variants.map((v: ProductVariant) => ({
                        id: crypto.randomUUID(),
                        backendId: v.id,
                        sku: v.sku || "",
                        size: v.size || "",
                        color: v.color || "",
                        price: v.price?.toString() || "",
                        stock_quantity: v.stock_quantity?.toString() || "0",
                        is_unlimited_stock: v.is_unlimited_stock || false,
                    }));
                    // Store original stock quantities for delta calculation on save
                    const origStock: Record<string, number> = {};
                    found.variants.forEach((v: ProductVariant) => {
                        if (v.id) origStock[v.id] = v.stock_quantity ?? 0;
                    });
                    originalStockRef.current = origStock;
                    setVariants(variantRows);
                }
            } else {
                setErrorInfo("Product not found.");
            }
        }).catch(err => {
            console.error("Failed to load product data:", err);
            setErrorInfo("Failed to load product details.");
        }).finally(() => setFetching(false));
    }, [id, token]);

    const addVariantRow = () => {
        setVariants((prev) => [...prev, {
            id: crypto.randomUUID(), sku: "", size: "", color: "", price: "", stock_quantity: "", is_unlimited_stock: false
        }]);
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
                // Smart SKU suggestion: If SKU is empty and we just updated size/color/name
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

        setVariants((prev) => [
            ...prev,
            {
                ...source,
                id: crypto.randomUUID(),
                backendId: undefined, // Must be new for DB
                size: "", // Clear size so user can enter new one
                sku: ""   // Clear SKU to avoid duplicate SKU errors
            },
        ]);
    };

    const removeVariant = (id: string) => {
        setVariants((prev) => prev.filter((v) => v.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token || !product) return;
        setLoading(true);

        const raw = new FormData(e.currentTarget);
        const payload = new FormData();

        // Basic Metadata
        const name = (raw.get("name") as string)?.trim();
        const description = (raw.get("description") as string)?.trim();
        const base_price = (raw.get("base_price") as string)?.trim();
        const category_id = raw.get("category_id") as string;
        const isVisible = raw.get("is_visible") === "true";

        if (name) payload.append("name", name);
        if (description) payload.append("description", description);
        if (base_price) payload.append("base_price", base_price);

        // CRITICAL: Only append if not empty to prevent backend 500 errors
        if (category_id && category_id !== "") {
            payload.append("category_id", category_id);
        }
        payload.append("is_visible", isVisible ? "true" : "false");

        // Design Attributes - Sanitize empty fields
        ["material", "sleeve", "length", "neck_line", "fit"].forEach(field => {
            const val = (raw.get(field) as string)?.trim();
            if (val && val !== "") payload.append(field, val);
        });

        // Media
        if (imageFile) payload.append("image", imageFile);
        galleryFiles.forEach(file => payload.append("images", file));

        // Variants - ALWAYS send, even if empty, to ensure deletions sync to backend
        const variantPayload = variants.map(({ id: _id, backendId, ...v }) => ({
            ...(backendId ? { id: backendId } : {}),
            sku: v.sku,
            size: v.size,
            color: v.color,
            price: Number(v.price || 0),
            stock_quantity: Number(v.stock_quantity || 0),
            is_unlimited_stock: v.is_unlimited_stock,
        }));
        payload.append("variants", JSON.stringify(variantPayload));

        try {
            // Step 1: Meta sync
            await updateProduct(product.id, payload, token);

            // Step 2: Stock sync (Delta)
            const stockSyncPromises = variants
                .filter(v => v.backendId && !v.is_unlimited_stock && v.stock_quantity !== "")
                .flatMap(v => {
                    const newQty = Number(v.stock_quantity || 0);
                    const originalQty = originalStockRef.current[v.backendId!] ?? 0;
                    const delta = newQty - originalQty;

                    if (delta === 0) return [];
                    const movementType = delta > 0 ? "IN" : "OUT";
                    const absDelta = Math.abs(delta);

                    return [
                        adjustInventory(v.backendId!, absDelta, movementType, "Editor Adjustment", token)
                    ];
                });

            await Promise.all(stockSyncPromises);
            setSuccessInfo("Product details synchronized successfully!");
            setTimeout(() => router.push("/backoffice/catalog"), 1000);
        } catch (err: any) {
            console.error("Save failed:", err);
            setErrorInfo("Server error. Please ensure all required fields are filled correctly.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
            </div>
        );
    }

    if (!product) {
        return <div>Product not found.</div>;
    }

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
                    ← Back to Catalog
                </button>
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-fuchsia-600">Product Studio</p>
                <h1 className="mt-2 text-4xl font-black text-slate-900 leading-tight">Edit Product</h1>
                <p className="mt-3 text-sm font-medium text-slate-400 max-w-xl">
                    Update the details below and hit <strong>Save Changes</strong> when ready.
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
                            <input name="name" required type="text" defaultValue={product.name}
                                placeholder="e.g. Silk Wrap Dress"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Slug</label>
                            <input name="slug" type="text" defaultValue={product.slug}
                                placeholder="silk-wrap-dress"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Description</label>
                            <textarea name="description" rows={4} defaultValue={product.description}
                                placeholder="Describe the garment — styling, occasion, fit notes..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition resize-none" />
                        </div>
                    </section>

                    {/* Design Attributes */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-black text-slate-900">Design Attributes</h2>
                            <p className="text-xs text-slate-400 font-medium mt-1">These power the storefront filters and reel-to-product linking.</p>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Combobox name="material" label="Material" options={MATERIAL_OPTIONS} placeholder="e.g. Georgette" defaultValue={(product as any).material} />
                            <Combobox name="sleeve" label="Sleeve Type" options={SLEEVE_OPTIONS} placeholder="e.g. Flutter Sleeves" defaultValue={(product as any).sleeve} />
                            <Combobox name="length" label="Length" options={LENGTH_OPTIONS} placeholder="e.g. Midi" defaultValue={(product as any).length} />
                            <Combobox name="neck_line" label="Neck Line" options={NECKLINE_OPTIONS} placeholder="e.g. V-Neck" defaultValue={(product as any).neck_line} />
                            <Combobox name="fit" label="Fit" options={FIT_OPTIONS} placeholder="e.g. Regular" defaultValue={(product as any).fit} />
                        </div>
                    </section>

                    {/* Variants Matrix */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Size & Color Variants</h2>
                                <p className="text-xs text-slate-400 font-medium mt-1">Each row is a unique purchasable unit (e.g. Red / XL).</p>
                            </div>
                            <button type="button" onClick={addVariantRow}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-600 transition-colors">
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


                    </section>

                    {/* Visual Media */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Visual Media</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div
                                onClick={() => document.getElementById("main-image-upload")?.click()}
                                className="group relative aspect-[3/4] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 hover:bg-slate-100 transition cursor-pointer overflow-hidden"
                            >
                                {mainImage ? (
                                    <img src={mainImage} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-700" alt="Preview" />
                                ) : (
                                    <>
                                        <span className="text-4xl opacity-20 group-hover:scale-125 transition duration-500">🖼️</span>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Main Image</p>
                                        <p className="text-[9px] text-slate-300 font-medium">JPG, PNG, WEBP</p>
                                    </>
                                )}
                                {mainImage && (
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Photo</p>
                                    </div>
                                )}
                                <input id="main-image-upload" type="file" accept="image/*" className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) { setImageFile(file); setMainImage(URL.createObjectURL(file)); }
                                    }} />
                            </div>

                            {/* Gallery grid mapping */}
                            {galleryPreviews.map((preview, idx) => (
                                <div key={idx} className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-slate-100 bg-slate-50">
                                    <img src={preview} className="h-full w-full object-cover" alt={`Gallery ${idx + 1}`} />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Handle local vs remote preview removal
                                            setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
                                            setGalleryFiles(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/90 text-rose-500 font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {/* Add More Photos */}
                            <div
                                onClick={() => galleryInputRef.current?.click()}
                                className="aspect-[3/4] rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 opacity-70 hover:opacity-100 transition cursor-pointer"
                            >
                                <span className="text-2xl opacity-30">➕</span>
                                <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">More Photos</p>
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
                        </div>
                    </section>
                </div>

                {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
                <div className="space-y-8">

                    {/* Classification */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Classification</h2>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Category</label>
                            <select name="category_id" defaultValue={product.category_detail?.id || product.category || ""}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition">
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
                            <input name="base_price" type="number" min="0" step="0.01"
                                defaultValue={product.base_price || (product as any).price || ""}
                                placeholder="e.g. 2500"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition" />
                            <p className="text-[9px] text-slate-400 font-medium">Used as the display price. Individual variant prices override this.</p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Store Visibility</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Toggle to hide this from the main catalog.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="is_visible" defaultChecked={product.is_visible !== false} className="sr-only peer" value="true" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    </section>



                    {/* Publish */}
                    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-5">
                        <Button type="submit" disabled={loading} className="w-full py-6 text-[10px] uppercase tracking-widest font-black h-auto">
                            {loading ? "Saving..." : "Save Changes →"}
                        </Button>
                        <p className="text-center text-[9px] text-slate-400 font-medium leading-relaxed">
                            This will update the product globally across all storefronts.
                        </p>
                    </section>
                </div>
            </form>
        </div>
    );
}
