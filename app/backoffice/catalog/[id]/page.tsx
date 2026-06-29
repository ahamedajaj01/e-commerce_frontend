"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { fetchBackofficeCategories, fetchBackofficeProducts, updateProduct, fetchBackofficeBrands } from "@/lib/api/catalog";
import { adjustInventory } from "@/lib/api/inventory";
import { getProductImage, getMediaUrl } from "@/lib/utils";
import type { Category, Product, ProductVariant, Brand } from "@/types/product";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Copy, Plus, X, Trash2, ChevronLeft, Save, Loader2, Image as ImageIcon, Box, Tag, Truck, ShieldCheck, LayoutGrid, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface VariantRow {
    id: string;
    backendId?: string;
    sku: string;
    label: string; // size
    variation: string; // name
    price: string;
    stock_quantity: string;
    is_unlimited_stock: boolean;
    image_id?: string;
}

// ─── Compact Input Components ───────────────────────────────────────────────
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
    name: string; label: string; placeholder?: string; defaultValue?: any; type?: string; required?: boolean; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

// ─── Bulk Add Tool ────────────────────────────────────────────────────────────
function BulkAddTool({ onGenerate }: { onGenerate: (variation: string, scales: string[]) => void }) {
    const [variation, setVariation] = useState("");
    const [scalesString, setScalesString] = useState("");

    const handleAdd = () => {
        const scales = scalesString.split(",").map(s => s.trim()).filter(s => s !== "");
        if (!variation || scales.length === 0) return;
        onGenerate(variation, scales);
        setVariation("");
        setScalesString("");
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-4">
            <div className="grid gap-4 sm:grid-cols-12 items-end">
                <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Variation</label>
                    <input
                        value={variation}
                        onChange={(e) => setVariation(e.target.value)}
                        placeholder="e.g. Gold Plated"
                        className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 h-9"
                    />
                </div>
                <div className="sm:col-span-5 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scales (S, M, L)</label>
                    <input
                        value={scalesString}
                        onChange={(e) => setScalesString(e.target.value)}
                        placeholder="e.g. S, M, L"
                        className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 h-9"
                    />
                </div>
                <div className="sm:col-span-3">
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!variation || !scalesString}
                        className="w-full h-9 bg-slate-900 text-white font-bold rounded-md text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 hover:bg-slate-800"
                    >
                        Bulk Generate
                    </button>
                </div>
            </div>
        </div>
    );
}

function ImagePicker({ selectedMediaId, mediaItems, onChange }: { selectedMediaId: string; mediaItems: any[]; onChange: (id: string) => void; }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedMedia = mediaItems.find(m => m.id === selectedMediaId);

    return (
        <div className="relative group/picker" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all shadow-inner relative"
            >
                {selectedMedia ? (
                    <img src={getMediaUrl(selectedMedia.file_url || selectedMedia.file)} className="h-full w-full object-cover" />
                ) : (
                    <ImageIcon className="w-4 h-4 text-slate-300" />
                )}
                <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 p-1 rounded-md shadow-sm">
                        <Plus className="w-3 h-3 text-slate-600" />
                    </div>
                </div>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-3 p-5 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] z-50 grid grid-cols-4 gap-3 min-w-[320px] animate-in fade-in slide-in-from-bottom-2 origin-bottom duration-200">
                        <div className="col-span-4 flex items-center justify-between mb-1 pb-2 border-b border-slate-50">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Link Variant Media</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em]">{mediaItems.length} Assets Available</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-6 h-6 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Remove Selection Option */}
                        <div
                            onClick={() => { onChange(""); setIsOpen(false); }}
                            className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 hover:bg-rose-50 transition-all group"
                        >
                            <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-rose-500" />
                        </div>

                        {mediaItems.length === 0 && (
                            <div className="col-span-3 flex items-center justify-center h-16 text-[9px] font-bold text-slate-300 uppercase italic">
                                No media uploaded
                            </div>
                        )}

                        {mediaItems.map(m => (
                            <div
                                key={m.id}
                                onClick={() => { onChange(m.id); setIsOpen(false); }}
                                className={`h-16 w-16 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${selectedMediaId === m.id ? 'border-blue-600 ring-4 ring-blue-600/10' : 'border-slate-50 hover:border-blue-400'}`}
                            >
                                <img src={getMediaUrl(m.file_url || m.file)} className="h-full w-full object-cover" />
                            </div>
                        ))}
                    </div>
                </>
            )}
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
    const [brands, setBrands] = useState<Brand[]>([]);
    const [variants, setVariants] = useState<VariantRow[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<string | null>(null);
    const [slug, setSlug] = useState("");
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const originalStockRef = useRef<Record<string, number>>({});

    const { token } = useAuth();

    const generateSlug = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSlug(generateSlug(val));
    };

    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetchBackofficeCategories(token),
            fetchBackofficeBrands(token),
            fetchBackofficeProducts(token),
        ]).then(([catsData, brandData, productsData]) => {
            setCategories(Array.isArray(catsData) ? catsData : (catsData as any)?.results || []);
            setBrands(Array.isArray(brandData) ? brandData : (brandData as any)?.results || []);
            const allProducts: Product[] = Array.isArray(productsData) ? productsData : (productsData as any)?.results || [];
            const found = allProducts.find(p => p.id === id) || null;
            if (found) {
                setProduct(found);
                setSlug(found.slug || "");
                setMainImage(getProductImage(found) || null);
                if (found.media && found.media.length > 1) {
                    setGalleryPreviews(found.media.slice(1).map(m => m.file_url || getMediaUrl(m.file) || ""));
                }
                if (found.variants) {
                    const variantRows = found.variants.map((v: ProductVariant) => ({
                        id: crypto.randomUUID(),
                        backendId: v.id,
                        sku: v.sku || "",
                        label: v.size || "",
                        variation: (v as any).name || (v as any).color || "",
                        price: v.price?.toString() || "",
                        stock_quantity: v.stock_quantity?.toString() || "0",
                        is_unlimited_stock: v.is_unlimited_stock || false,
                        image_id: (v as any).image_id || (typeof (v as any).image === 'object' ? (v as any).image?.id : (v as any).image) || undefined,
                    }));
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
            id: crypto.randomUUID(), sku: "", label: "", variation: "", price: "", stock_quantity: "", is_unlimited_stock: false
        }]);
    };

    const updateVariant = (id: string, field: keyof VariantRow, value: string | boolean) => {
        setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
    };

    const duplicateVariant = (id: string) => {
        const source = variants.find(v => v.id === id);
        if (!source) return;
        setVariants((prev) => [...prev, { ...source, id: crypto.randomUUID(), backendId: undefined, sku: "" }]);
    };

    const removeVariant = (id: string) => {
        setVariants((prev) => prev.filter((v) => v.id !== id));
    };

    const bulkAddVariants = (variation: string, selectedScales: string[]) => {
        const basePrice = (document.getElementsByName("base_price")[0] as HTMLInputElement)?.value || "";
        const newRows = selectedScales.map(scale => ({
            id: crypto.randomUUID(),
            variation: variation,
            label: scale,
            price: basePrice,
            stock_quantity: "0",
            is_unlimited_stock: false,
            sku: ""
        }));
        setVariants(prev => [...prev, ...newRows]);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token || !product) return;
        setLoading(true);
        const raw = new FormData(e.currentTarget);
        const payload = new FormData();

        ["name", "slug", "description", "base_price", "category_id", "brand_id"].forEach(f => {
            const val = raw.get(f) as string;
            if (val) payload.append(f, val);
        });
        payload.append("is_visible", raw.get("is_visible") === "true" ? "true" : "false");

        ["material", "sleeve", "length", "neck_line", "fit", "processing_days_min", "processing_days_max"].forEach(field => {
            const val = (raw.get(field) as string)?.trim();
            if (val) payload.append(field, val);
        });

        if (imageFile) payload.append("image", imageFile);
        galleryFiles.forEach(file => payload.append("images", file));

        const variantPayload = variants.map(({ id: _id, backendId, label, variation, image_id, ...v }) => ({
            ...(backendId ? { id: backendId } : {}),
            sku: v.sku,
            size: label || "",
            name: variation || "",
            image_id: image_id || null,
            image: image_id || null, // Add 'image' as fallback mapping if the backend expects it
            price: Number(v.price || 0),
            stock_quantity: Number(v.stock_quantity || 0),
            is_unlimited_stock: v.is_unlimited_stock,
        }));
        payload.append("variants", JSON.stringify(variantPayload));

        try {
            await updateProduct(product.id, payload, token);
            const stockSyncPromises = variants
                .filter(v => v.backendId && !v.is_unlimited_stock && v.stock_quantity !== "")
                .flatMap(v => {
                    const delta = Number(v.stock_quantity || 0) - (originalStockRef.current[v.backendId!] ?? 0);
                    if (delta === 0) return [];
                    return [adjustInventory(v.backendId!, Math.abs(delta), delta > 0 ? "IN" : "OUT", "Backup Adjust", token)];
                });
            await Promise.all(stockSyncPromises);
            setSuccessInfo("Catalog synchronized successfully!");
            setTimeout(() => router.push("/backoffice/catalog"), 1000);
        } catch (err) {
            setErrorInfo("Failed to synchronize catalog item.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>;

    if (!product) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 font-sans">
                <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                        <X className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Product Disappeared</h2>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            {errorInfo || "The catalog entry you're looking for doesn't exist or may have been removed."}
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/backoffice/catalog")}
                        className="w-full bg-slate-900 hover:bg-black text-white font-black h-12 uppercase tracking-widest text-[10px] rounded-xl transition-all active:scale-[0.98]"
                    >
                        Back to Inventory
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f8fafc] min-h-screen">
            <div className="max-w-[1280px] mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Header Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-8 mb-8 bg-slate-50/30 -mx-10 px-10 pt-4">
                        <div className="space-y-1">
                            <button type="button" onClick={() => router.back()} className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest mb-3 group">
                                <div className="p-1 rounded bg-white shadow-sm border border-slate-200 group-hover:border-slate-300">
                                    <ChevronLeft className="w-3 h-3" />
                                </div>
                                Catalog Archive
                            </button>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                                {product.name}
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-widest shadow-sm self-center mt-1">
                                    <span className="opacity-30">ID:</span> {product.id.slice(0, 8)}
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
                                {loading ? "Synchronizing..." : "Save Product Details"}
                            </button>
                        </div>
                    </div>

                    <div className="max-w-[1000px] mx-auto space-y-6">
                        {/* Status Messages */}
                        <AlertBanner message={errorInfo || ""} type="error" onClose={() => setErrorInfo(null)} className="rounded-md h-auto py-3 px-4 text-xs font-medium" />
                        {successInfo && <AlertBanner message={successInfo} type="success" onClose={() => setSuccessInfo(null)} className="rounded-md h-auto py-3 px-4 text-xs font-medium" />}

                        {/* 1. PRODUCT MEDIA */}
                        <Section title="Product Media" icon={ImageIcon} description="Visual Assets Workflow">
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
                                <div
                                    onClick={() => document.getElementById("main-image-upload")?.click()}
                                    className="aspect-[3/4] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white hover:border-blue-500 transition-all group overflow-hidden relative shadow-sm"
                                >
                                    {mainImage ? (
                                        <img src={mainImage} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-sm group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master</span>
                                        </>
                                    )}
                                    <input id="main-image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setMainImage(URL.createObjectURL(f)); } }} />
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
                                    <input ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { const fs = Array.from(e.target.files || []); setGalleryFiles(prev => [...prev, ...fs]); setGalleryPreviews(prev => [...prev, ...fs.map(f => URL.createObjectURL(f))]); }} />
                                </div>
                            </div>
                        </Section>

                        {/* 2. BASIC PRODUCT INFORMATION */}
                        {/* 2. ESSENTIAL INFORMATION */}
                        <Section title="Essential Information" icon={Info} description="Primary commercial identity">
                            <div className="space-y-6">
                                <TextInput name="name" label="PRODUCT NAME *" defaultValue={product.name} required placeholder="e.g. Kurti" onChange={handleNameChange} />
                                <TextInput name="slug" label="SLUG" placeholder="product-url-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                                <div className="group space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1 group-focus-within:text-blue-600 transition-colors">DESCRIPTION</label>
                                    <textarea name="description" rows={5} defaultValue={product.description} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 border-neutral-200 transition-all shadow-sm resize-none group-hover:border-slate-300" placeholder="Describe the item..." />
                                </div>
                            </div>
                        </Section>

                        {/* 3. CLASSIFICATION */}
                        <Section title="Classification" icon={LayoutGrid} description="Categorization & Pricing Registry">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="group space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1 group-focus-within:text-blue-600 transition-colors">CATEGORY</label>
                                    <div className="relative">
                                        <select name="category_id" defaultValue={product.category_detail?.id || product.category || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer group-hover:border-slate-300">
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
                                        <select name="brand_id" defaultValue={(product as any).brand_detail?.id || product.brand || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer group-hover:border-slate-300">
                                            <option value="">No Brand / Private Label</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <TextInput name="base_price" label="BASE PRICE (NPR) *" defaultValue={product.base_price || (product as any).price} required type="number" placeholder="0.00" />

                                <div className="pt-4 border-t border-slate-100 md:col-span-2 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">STORE VISIBILITY</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Toggle to hide this from the main catalog</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-110 origin-right">
                                        <input type="checkbox" name="is_visible" defaultChecked={product.is_visible !== false} className="sr-only peer" value="true" />
                                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                    </label>
                                </div>
                            </div>
                        </Section>

                        {/* 3. PRODUCT VARIANTS */}
                        <Section
                            title="Product Variants"
                            icon={Box}
                            description="Stock Management & Variation Registry"
                            actions={
                                <button type="button" onClick={addVariantRow} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 shadow-slate-200">
                                    <Plus className="w-3.5 h-3.5" /> New Variant
                                </button>
                            }
                        >
                            <BulkAddTool onGenerate={bulkAddVariants} />

                            <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-visible">
                                <table className="w-full text-[11px] border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest">
                                            <th className="px-5 py-4 text-left w-12 opacity-50">#</th>
                                            <th className="px-4 py-4 text-left w-14 opacity-50">Slot</th>
                                            <th className="px-4 py-4 text-left">SKU</th>
                                            <th className="px-4 py-4 text-left w-20">LABEL / SIZE</th>
                                            <th className="px-4 py-4 text-left">VARIATION</th>
                                            <th className="px-4 py-4 text-left w-24">PRICE (NPR)</th>
                                            <th className="px-4 py-4 text-left w-28">STOCK QTY</th>
                                            <th className="px-5 py-4 text-right w-24 opacity-50">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {variants.map((v, i) => {
                                            const media = (product.media || []).find(m => m.id === v.image_id);
                                            return (
                                                <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-4 text-slate-300 font-black">{i + 1}</td>
                                                    <td className="px-4 py-4">
                                                        <ImagePicker
                                                            selectedMediaId={v.image_id || ""}
                                                            mediaItems={product.media || []}
                                                            onChange={id => updateVariant(v.id, "image_id", id)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input value={v.sku} onChange={e => updateVariant(v.id, "sku", e.target.value)} className="w-full bg-transparent border-none p-0 font-bold text-slate-900 focus:ring-0 placeholder:text-slate-200" placeholder="Variant SKU" />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input value={v.label} onChange={e => updateVariant(v.id, "label", e.target.value)} className="w-full bg-transparent border-none p-0 font-bold text-slate-900 focus:ring-0 placeholder:text-slate-200" placeholder="e.g. L" />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input value={v.variation} onChange={e => updateVariant(v.id, "variation", e.target.value)} className="w-full bg-transparent border-none p-0 font-bold text-slate-900 focus:ring-0 placeholder:text-slate-200" placeholder="e.g. Forest Green" />
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
                                                            <button type="button" onClick={() => duplicateVariant(v.id)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
                                                            <button type="button" onClick={() => removeVariant(v.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        {/* 4. TECHNICAL SPECS & OTHERS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Section title="Design Attributes" icon={ShieldCheck} description="Storefront filters & linking">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <TextInput name="material" label="Primary Material" defaultValue={(product as any).material} />
                                    <TextInput name="sleeve" label="Primary Detail / Type" defaultValue={(product as any).sleeve} />
                                    <TextInput name="length" label="Secondary Detail" defaultValue={(product as any).length} />
                                    <TextInput name="neck_line" label="Styling / Connection" defaultValue={(product as any).neck_line} />
                                    <div className="col-span-2">
                                        <TextInput name="fit" label="Standard Fit / Style" defaultValue={(product as any).fit} />
                                    </div>
                                </div>
                            </Section>

                            <Section title="Logistics" icon={Truck} description="Dispatch Timelines">
                                <div className="grid grid-cols-2 gap-6">
                                    <TextInput type="number" name="processing_days_min" label="MIN PROCESSING DAYS" defaultValue={(product as any).processing_days_min} />
                                    <TextInput type="number" name="processing_days_max" label="MAX PROCESSING DAYS" defaultValue={(product as any).processing_days_max} />
                                </div>
                            </Section>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
