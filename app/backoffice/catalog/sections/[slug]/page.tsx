"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchBackofficeProducts } from "@/lib/api/catalog";
import {
    fetchBackofficePromotions,
    updatePromotion,
    createPromotion,
    deletePromotion,
} from "@/lib/api/cms";
import { fetchBackofficeCategories } from "@/lib/api/catalog";
import type { Product } from "@/types/product";
import type { Promotion } from "@/types/cms";
import type { Category } from "@/types/product";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { getProductImage, getMediaUrl } from "@/lib/utils";
import {
    Search,
    Plus,
    X,
    Trash2,
    Save,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Pencil,
    ArrowLeft,
    AlertTriangle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT =
    "w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition placeholder:text-slate-300";

// Standard catalog sections (not homepage, not exclusive-collection)
const SECTION_CONFIG: Record<string, { title: string; description: string; promoTitle: string }> = {
    "trending": {
        title: "Trending Now",
        description: "Configure products displayed in the Trending Now section across the storefront.",
        promoTitle: "Trending Now",
    },
    "best-sellers": {
        title: "Best Sellers",
        description: "Configure products displayed in the Best Sellers section across the storefront.",
        promoTitle: "Best Sellers",
    },
    "new-arrivals": {
        title: "New Arrivals",
        description: "Configure products displayed in the New Arrivals section across the storefront.",
        promoTitle: "New Arrivals",
    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

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

// ─── Product Picker ───────────────────────────────────────────────────────────

function ProductPicker({
    products,
    selectedIds,
    onToggle,
    archivePage,
    archiveTotalPages,
    onPageChange,
    archiveSearch,
    onSearchChange,
    isLoading,
}: {
    products: Product[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    archivePage: number;
    archiveTotalPages: number;
    onPageChange: (p: number) => void;
    archiveSearch: string;
    onSearchChange: (v: string) => void;
    isLoading: boolean;
}) {
    const available = products
        .filter((p) => !selectedIds.includes(p.id))
        .filter((p) => p.name.toLowerCase().includes(archiveSearch.toLowerCase()));

    return (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden flex flex-col" style={{ height: 420 }}>
            <div className="px-3 py-2.5 border-b border-slate-100 flex-shrink-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Catalog</p>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search products…"
                        value={archiveSearch}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full border border-slate-200 rounded pl-8 pr-3 py-1.5 text-sm outline-none focus:border-slate-400 transition"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                    </div>
                ) : available.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-slate-400">
                        No products available
                    </div>
                ) : (
                    available.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition group">
                            <div className="w-7 h-7 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                <img src={getProductImage(p)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-900 truncate">{p.name}</p>
                                <p className="text-[11px] text-slate-400">NPR {p.base_price}</p>
                            </div>
                            <button
                                onClick={() => onToggle(p.id)}
                                title="Add to selection"
                                className="p-1 rounded text-slate-300 hover:text-slate-700 hover:bg-slate-100 transition opacity-0 group-hover:opacity-100"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
            {archiveTotalPages > 1 && (
                <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                    <span className="text-xs text-slate-400">Page {archivePage} of {archiveTotalPages}</span>
                    <div className="flex gap-1">
                        <button
                            disabled={archivePage === 1}
                            onClick={() => onPageChange(archivePage - 1)}
                            className="p-1 rounded border border-slate-200 text-slate-500 disabled:opacity-40 hover:border-slate-400 transition"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            disabled={archivePage >= archiveTotalPages}
                            onClick={() => onPageChange(archivePage + 1)}
                            className="p-1 rounded border border-slate-200 text-slate-500 disabled:opacity-40 hover:border-slate-400 transition"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Selected Products Panel ──────────────────────────────────────────────────

function SelectedProductsPanel({
    products,
    selectedIds,
    onRemove,
}: {
    products: Product[];
    selectedIds: string[];
    onRemove: (id: string) => void;
}) {
    const selected = products.filter((p) => selectedIds.includes(p.id));
    return (
        <div className="border border-slate-200 rounded-md bg-white overflow-hidden flex flex-col" style={{ height: 420 }}>
            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected</p>
                <span className="text-xs text-slate-400">{selected.length} products</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {selected.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-slate-400">
                        No products selected
                    </div>
                ) : (
                    selected.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 group hover:bg-slate-50 transition">
                            <div className="w-7 h-7 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                <img src={getProductImage(p)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-900 truncate">{p.name}</p>
                                <p className="text-[11px] text-slate-400">NPR {p.base_price}</p>
                            </div>
                            <button
                                onClick={() => onRemove(p.id)}
                                title="Remove"
                                className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Collection Form Modal ────────────────────────────────────────────────────

function CollectionModal({
    mode,
    initialTitle,
    initialCategory,
    fileInputRef,
    imagePreview,
    onImageChange,
    onSave,
    onClose,
    isSaving,
    error,
    categories,
}: {
    mode: "create" | "edit";
    initialTitle: string;
    initialCategory: string;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    imagePreview: string | null;
    onImageChange: (file: File) => void;
    onSave: (title: string, category: string) => void;
    onClose: () => void;
    isSaving: boolean;
    error: string | null;
    categories: Category[];
}) {
    const [title, setTitle] = useState(initialTitle);
    const [category, setCategory] = useState(initialCategory);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">
                        {mode === "create" ? "New Collection" : "Edit Collection"}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-5 py-5 space-y-4">
                    {error && (
                        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-md px-3 py-2.5 text-sm text-rose-700">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    <Field label="Collection Name" required>
                        <input
                            type="text"
                            placeholder="e.g. Summer Essentials"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={INPUT}
                            autoFocus
                        />
                    </Field>
                    <Field label="Auto-sync Category">
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
                            <option value="">No auto-sync (manual only)</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Link a category to automatically pull its products.
                        </p>
                    </Field>
                    <Field label="Banner Image">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm text-slate-600 border border-slate-200 rounded-md px-3 py-2 hover:border-slate-400 hover:text-slate-900 transition"
                            >
                                {imagePreview ? "Change Image" : "Upload Image"}
                            </button>
                            {imagePreview && (
                                <div className="w-14 h-10 rounded border border-slate-200 overflow-hidden">
                                    <img
                                        src={imagePreview.startsWith("http") ? imagePreview : getMediaUrl(imagePreview)}
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) onImageChange(f);
                                }}
                            />
                        </div>
                    </Field>
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={!title.trim()}
                        loading={isSaving}
                        onClick={() => onSave(title, category)}
                    >
                        {mode === "create" ? "Create Collection" : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function SectionContent({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
    const params = React.use(paramsPromise);
    const slug = params.slug as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetId = searchParams.get("id");
    const { token, isAuthenticated } = useAuth();
    const { confirm } = useModal();

    const isHomepage = slug === "homepage";
    const isExclusive = slug === "exclusive-collection";
    const isStandard = !isHomepage && !isExclusive && !!SECTION_CONFIG[slug];
    const stdConfig = SECTION_CONFIG[slug];

    // ── Shared ────────────────────────────────────────────────────────────────
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Archive / picker
    const [archivePage, setArchivePage] = useState(1);
    const [archiveTotal, setArchiveTotal] = useState(0);
    const [archiveSearch, setArchiveSearch] = useState("");
    const ARCHIVE_SIZE = 25;
    const archiveTotalPages = Math.ceil(archiveTotal / ARCHIVE_SIZE);

    // ── Homepage state ────────────────────────────────────────────────────────
    const [homepagePromo, setHomepagePromo] = useState<Promotion | null>(null);
    const [homepageSelectedIds, setHomepageSelectedIds] = useState<string[]>([]);

    // ── Standard Sections state ───────────────────────────────────────────────
    const [standardPromo, setStandardPromo] = useState<Promotion | null>(null);
    const [standardSelectedIds, setStandardSelectedIds] = useState<string[]>([]);

    // ── Exclusive collections state ───────────────────────────────────────────
    const [editingCollection, setEditingCollection] = useState<Promotion | null>(null);
    const [collectionSelectedIds, setCollectionSelectedIds] = useState<string[]>([]);
    const [collectionSearch, setCollectionSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [modalError, setModalError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // ─── Data load ────────────────────────────────────────────────────────────

    const load = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [promoData, prodRes, catData] = await Promise.all([
                fetchBackofficePromotions(token),
                fetchBackofficeProducts(token, { page: archivePage, page_size: ARCHIVE_SIZE }),
                fetchBackofficeCategories(token),
            ]);

            const promos: Promotion[] = Array.isArray(promoData)
                ? promoData
                : (promoData as any)?.results || [];
            setPromotions(promos);
            setProducts(prodRes.results);
            setArchiveTotal(prodRes.count);
            setCategories(Array.isArray(catData) ? catData : (catData as any)?.results || []);

            if (isHomepage) {
                const hp = promos.find(
                    (p) =>
                        p.title === "Homepage Selection" ||
                        p.title.toLowerCase().replace(/\s+/g, "-") === "homepage" ||
                        (p as any).slug === "homepage"
                );
                if (hp) {
                    setHomepagePromo(hp);
                    setHomepageSelectedIds(
                        hp.products?.map((i: any) => (typeof i === "string" ? i : i.id)) ||
                        hp.product_ids || []
                    );
                }
            }

            if (isStandard && stdConfig) {
                const sp = promos.find(
                    (p) =>
                        p.title === stdConfig.promoTitle ||
                        p.title.toLowerCase().replace(/\s+/g, "-") === slug ||
                        (p as any).slug === slug
                );
                if (sp) {
                    setStandardPromo(sp);
                    setStandardSelectedIds(
                        sp.products?.map((i: any) => (typeof i === "string" ? i : i.id)) ||
                        sp.product_ids || []
                    );
                }
            }

            if (isExclusive && targetId) {
                const target = promos.find((p) => p.id === targetId);
                if (target) {
                    setEditingCollection(target);
                    setCollectionSelectedIds(
                        target.products?.map((i: any) => (typeof i === "string" ? i : i.id)) ||
                        target.product_ids || []
                    );
                    if (target.image) setImagePreview(target.image);
                }
            }
        } catch {
            setError("Failed to load data.");
        } finally {
            setIsLoading(false);
        }
    }, [token, archivePage, isHomepage, isExclusive, targetId]);

    useEffect(() => {
        if (isAuthenticated && token) load();
    }, [token, isAuthenticated, load]);

    // ─── Homepage & Standard section handlers ─────────────────────────────────

    const saveHomepage = async () => {
        if (!token) return;
        setIsSaving(true);
        setError(null);
        try {
            const payload = {
                title: "Homepage Selection",
                description: "System Managed: homepage",
                promotion_type: "SYSTEM",
                is_visible: true,
                is_active: true,
                product_ids: homepageSelectedIds,
                products: homepageSelectedIds,
                category: null,
            };
            if (homepagePromo) {
                await updatePromotion(homepagePromo.id, payload, token);
            } else {
                const created = await createPromotion(payload, token);
                setHomepagePromo(created);
            }
            setSuccess("Homepage selection saved.");
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError("Failed to save homepage selection.");
        } finally {
            setIsSaving(false);
        }
    };

    const saveStandardSection = async () => {
        if (!token || !stdConfig) return;
        setIsSaving(true);
        setError(null);
        try {
            const payload = {
                title: stdConfig.promoTitle,
                description: `System Managed: ${slug}`,
                promotion_type: "SYSTEM",
                is_visible: true,
                is_active: true,
                product_ids: standardSelectedIds,
                products: standardSelectedIds,
                category: null,
            };
            if (standardPromo) {
                await updatePromotion(standardPromo.id, payload, token);
            } else {
                const created = await createPromotion(payload, token);
                setStandardPromo(created);
            }
            setSuccess(`${stdConfig.title} saved.`);
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError(`Failed to save ${stdConfig.title}.`);
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Exclusive collection handlers ────────────────────────────────────────

    const exclusiveCollections = promotions.filter(
        (p) => p.description === "Storefront Exclusive Collection"
    );

    const filteredCollections = exclusiveCollections.filter((c) =>
        c.title.toLowerCase().includes(collectionSearch.toLowerCase())
    );

    const openCreate = () => {
        setModalMode("create");
        setImagePreview(null);
        setImageFile(null);
        setModalError(null);
        setShowModal(true);
    };

    const openEdit = (c: Promotion) => {
        setEditingCollection(c);
        setCollectionSelectedIds(
            c.products?.map((i: any) => (typeof i === "string" ? i : i.id)) ||
            c.product_ids || []
        );
        setImagePreview(c.image || null);
        setImageFile(null);
        setModalMode("edit");
        setModalError(null);
        setShowModal(true);
        router.push(`?id=${c.id}`, { scroll: false });
    };

    const handleModalSave = async (title: string, categoryId: string) => {
        if (!token || !title.trim()) return;
        setIsSaving(true);
        setModalError(null);
        try {
            if (imageFile) {
                const fd = new FormData();
                fd.append("title", title);
                fd.append("description", "Storefront Exclusive Collection");
                fd.append("promotion_type", "EXCLUSIVE");
                fd.append("is_visible", "true");
                fd.append("is_active", "true");
                if (categoryId) fd.append("category", categoryId);
                fd.append("image", imageFile);
                if (modalMode === "edit" && editingCollection) {
                    await updatePromotion(editingCollection.id, fd, token);
                } else {
                    await createPromotion(fd, token);
                }
            } else {
                const payload: any = {
                    title,
                    description: "Storefront Exclusive Collection",
                    promotion_type: "EXCLUSIVE",
                    is_visible: true,
                    is_active: true,
                    category: categoryId || null,
                };
                if (modalMode === "edit" && editingCollection) {
                    await updatePromotion(editingCollection.id, payload, token);
                } else {
                    await createPromotion(payload, token);
                }
            }
            setShowModal(false);
            setSuccess(modalMode === "create" ? "Collection created." : "Collection updated.");
            setTimeout(() => setSuccess(null), 3000);
            load();
        } catch {
            setModalError("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const saveCollectionProducts = async () => {
        if (!token || !editingCollection) return;
        setIsSaving(true);
        setError(null);
        try {
            await updatePromotion(editingCollection.id, {
                product_ids: collectionSelectedIds,
                products: collectionSelectedIds,
            }, token);
            setSuccess("Products saved.");
            setTimeout(() => setSuccess(null), 3000);
            load();
        } catch {
            setError("Failed to save products.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        confirm({
            title: "Delete this collection?",
            description: "This cannot be undone. All curated products and metadata for this collection will be permanently removed.",
            confirmText: "Delete Collection",
            variant: "danger",
            onConfirm: async () => {
                await deletePromotion(id, token!);
                setSuccess("Collection deleted.");
                setTimeout(() => setSuccess(null), 3000);
                if (editingCollection?.id === id) {
                    setEditingCollection(null);
                    router.push("?", { scroll: false });
                }
                load();
            }
        });
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
            <AlertBanner message={error || ""} type="error" onClose={() => setError(null)} />
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* ══ HOMEPAGE SELECTION ═══════════════════════════════════════════ */}
            {isHomepage && (
                <>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">
                                Homepage Selections
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Configure products displayed in the homepage featured section.
                            </p>
                        </div>
                        <Button
                            onClick={saveHomepage}
                            loading={isSaving}
                        >
                            Save Changes
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectedProductsPanel
                            products={products}
                            selectedIds={homepageSelectedIds}
                            onRemove={(id) =>
                                setHomepageSelectedIds((prev) => prev.filter((i) => i !== id))
                            }
                        />
                        <ProductPicker
                            products={products}
                            selectedIds={homepageSelectedIds}
                            onToggle={(id) =>
                                setHomepageSelectedIds((prev) =>
                                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                                )
                            }
                            archivePage={archivePage}
                            archiveTotalPages={archiveTotalPages}
                            onPageChange={setArchivePage}
                            archiveSearch={archiveSearch}
                            onSearchChange={setArchiveSearch}
                            isLoading={isLoading}
                        />
                    </div>
                </>
            )}

            {/* ══ STANDARD CATALOG SECTIONS (Trending, Best Sellers, etc.) ════ */}
            {isStandard && stdConfig && (
                <>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">
                                {stdConfig.title}
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {stdConfig.description}
                            </p>
                        </div>
                        <Button
                            onClick={saveStandardSection}
                            loading={isSaving}
                        >
                            Save Changes
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectedProductsPanel
                            products={products}
                            selectedIds={standardSelectedIds}
                            onRemove={(id) =>
                                setStandardSelectedIds((prev) => prev.filter((i) => i !== id))
                            }
                        />
                        <ProductPicker
                            products={products}
                            selectedIds={standardSelectedIds}
                            onToggle={(id) =>
                                setStandardSelectedIds((prev) =>
                                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                                )
                            }
                            archivePage={archivePage}
                            archiveTotalPages={archiveTotalPages}
                            onPageChange={setArchivePage}
                            archiveSearch={archiveSearch}
                            onSearchChange={setArchiveSearch}
                            isLoading={isLoading}
                        />
                    </div>
                </>
            )}

            {/* ══ EXCLUSIVE COLLECTIONS — LIST VIEW ═══════════════════════════ */}
            {isExclusive && !editingCollection && (
                <>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">
                                Exclusive Collections
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Manage curated collections highlighted across the storefront.
                            </p>
                        </div>
                        <Button
                            onClick={openCreate}
                            className="gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Collection
                        </Button>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search collections…"
                                value={collectionSearch}
                                onChange={(e) => setCollectionSearch(e.target.value)}
                                className="w-full border border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                            />
                        </div>
                        <span className="ml-auto text-xs text-slate-400">
                            {exclusiveCollections.length} collection{exclusiveCollections.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    {["Collection", "Products", "Banner", "Status", ""].map((h) => (
                                        <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider last:text-right">
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
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-3.5 bg-slate-100 rounded w-full" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredCollections.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                                            {exclusiveCollections.length === 0
                                                ? "No collections yet. Create one to get started."
                                                : "No collections match your search."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCollections.map((col) => {
                                        const count = col.products?.length ?? col.product_ids?.length ?? 0;
                                        return (
                                            <tr key={col.id} className="hover:bg-slate-50 transition group">
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCollection(col);
                                                            setCollectionSelectedIds(
                                                                col.products?.map((i: any) =>
                                                                    typeof i === "string" ? i : i.id
                                                                ) || col.product_ids || []
                                                            );
                                                            setImagePreview(col.image || null);
                                                            router.push(`?id=${col.id}`, { scroll: false });
                                                        }}
                                                        className="text-sm font-medium text-slate-900 hover:underline text-left"
                                                    >
                                                        {col.title}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-slate-500">{count}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {col.image ? (
                                                        <div className="w-10 h-7 rounded border border-slate-200 overflow-hidden">
                                                            <img
                                                                src={col.image.startsWith("http") ? col.image : getMediaUrl(col.image)}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge active={col.is_active ?? true} />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                                        <button
                                                            onClick={() => openEdit(col)}
                                                            title="Edit details"
                                                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(col.id)}
                                                            title="Delete collection"
                                                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                        >
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
                </>
            )}

            {/* ══ EXCLUSIVE COLLECTIONS — EDIT PRODUCTS VIEW ══════════════════ */}
            {isExclusive && editingCollection && (
                <>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => {
                                    setEditingCollection(null);
                                    router.push("?", { scroll: false });
                                }}
                                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div>
                                <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">
                                    {editingCollection.title}
                                </h1>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Exclusive Collection — product configuration
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openEdit(editingCollection)}
                                className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-md text-sm hover:border-slate-400 hover:text-slate-900 transition"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit Details
                            </button>
                            <button
                                onClick={saveCollectionProducts}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-60 transition"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Save Products
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectedProductsPanel
                            products={products}
                            selectedIds={collectionSelectedIds}
                            onRemove={(id) =>
                                setCollectionSelectedIds((prev) => prev.filter((i) => i !== id))
                            }
                        />
                        <ProductPicker
                            products={products}
                            selectedIds={collectionSelectedIds}
                            onToggle={(id) =>
                                setCollectionSelectedIds((prev) =>
                                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                                )
                            }
                            archivePage={archivePage}
                            archiveTotalPages={archiveTotalPages}
                            onPageChange={setArchivePage}
                            archiveSearch={archiveSearch}
                            onSearchChange={setArchiveSearch}
                            isLoading={isLoading}
                        />
                    </div>
                </>
            )}

            {/* ══ Collection Modal ═════════════════════════════════════════════ */}
            {showModal && (
                <CollectionModal
                    mode={modalMode}
                    initialTitle={modalMode === "edit" && editingCollection ? editingCollection.title : ""}
                    initialCategory=""
                    fileInputRef={fileInputRef}
                    imagePreview={imagePreview}
                    onImageChange={(f) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }}
                    onSave={handleModalSave}
                    onClose={() => { setShowModal(false); setModalError(null); }}
                    isSaving={isSaving}
                    error={modalError}
                    categories={categories}
                />
            )}
        </div>
    );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function CatalogSectionPage(props: { params: Promise<{ slug: string }> }) {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
            }
        >
            <SectionContent {...props} />
        </Suspense>
    );
}
