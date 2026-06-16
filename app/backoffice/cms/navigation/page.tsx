"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    fetchBackofficeNavigationItems,
    fetchBackofficeNavigation,
    createNavigationItem,
    updateNavigationItem,
    createNavigationMenu,
    updateNavigationMenu,
    deleteNavigation,
    deleteNavigationItem,
} from "@/lib/api/cms";
import { fetchBackofficeCategories } from "@/lib/api/catalog";
import type { NavigationItem, NavigationMenu } from "@/types/cms";
import type { Category } from "@/types/product";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
    Plus,
    X,
    Trash2,
    ChevronRight,
    Star,
    Zap,
    Settings,
    Pencil,
    Search,
    ChevronDown,
    Loader2,
    MoveRight,
} from "lucide-react";

const SYSTEM_ROUTES = [
    { name: "New Arrivals", path: "/collections/new-arrivals" },
    { name: "Trending Now", path: "/collections/trending" },
    { name: "Best Sellers", path: "/collections/best-sellers" },
    { name: "Exclusive Collections", path: "/collections/exclusive" },
];

const INPUT =
    "w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition placeholder:text-slate-300";

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavTreeRow({
    item,
    depth = 0,
    onAddChild,
    onDelete,
    onEdit,
    onToggle,
}: {
    item: NavigationItem;
    depth?: number;
    onAddChild: (parent: NavigationItem) => void;
    onDelete: (id: string) => void;
    onEdit: (item: NavigationItem) => void;
    onToggle: (item: NavigationItem) => void;
}) {
    return (
        <div className="w-full">
            <div className={`flex items-center group border-b border-slate-50 hover:bg-slate-50 transition-colors ${item.is_active === false ? "bg-slate-50/50" : ""}`}>
                <div
                    className="flex items-center gap-2 border-r border-slate-100/50 py-3 pr-4 h-full"
                    style={{ paddingLeft: (depth * 28) + 16 }}
                >
                    {depth > 0 && <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium truncate ${item.is_active === false ? "text-slate-400 line-through" : "text-slate-900"}`}>
                                {item.label}
                            </span>
                            {item.is_featured && (
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <MoveRight className="w-2.5 h-2.5 text-slate-300" />
                            <span className="text-[11px] text-slate-400 truncate font-mono">
                                {item.category_slug ? `category/${item.category_slug}` : (item.href || item.linked_url || "—")}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${item.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.is_active !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {item.is_active !== false ? "Active" : "Hidden"}
                        </span>
                    </div>
                </div>

                <div className="px-4 py-3 border-l border-slate-100/50 flex items-center justify-end gap-1 min-w-[140px]">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                            onClick={() => onAddChild(item)}
                            title="Add sub-link"
                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onEdit(item)}
                            title="Edit"
                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onToggle(item)}
                            title={item.is_active !== false ? "Hide" : "Show"}
                            className={`p-1.5 rounded transition ${item.is_active !== false ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}
                        >
                            <Zap className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
            {item.children?.map((child) => (
                <NavTreeRow
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    onAddChild={onAddChild}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onToggle={onToggle}
                />
            ))}
        </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NavigationPage() {
    const { token, isAuthenticated } = useAuth();
    const { confirm } = useModal();

    const [navItems, setNavItems] = useState<NavigationItem[]>([]);
    const [menus, setMenus] = useState<NavigationMenu[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state: Navigation Item
    const [label, setLabel] = useState("");
    const [linkedCategoryId, setLinkedCategoryId] = useState("");
    const [linkedUrl, setLinkedUrl] = useState("");
    const [parentId, setParentId] = useState("");
    const [selectedMenuId, setSelectedMenuId] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [isActive, setIsActive] = useState(true);

    // Form states
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [menuName, setMenuName] = useState("");
    const [menuSlug, setMenuSlug] = useState("");
    const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
    const [addingChildOf, setAddingChildOf] = useState<NavigationItem | null>(null);

    // Filter/Search
    const [searchTerm, setSearchTerm] = useState("");

    const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [itemsData, menusDataRaw, catsData] = await Promise.all([
                fetchBackofficeNavigationItems(token),
                fetchBackofficeNavigation(token),
                fetchBackofficeCategories(token),
            ]);
            setNavItems(itemsData);

            let menusData = menusDataRaw;
            if (menusData.length === 0) {
                try {
                    await createNavigationMenu({ name: 'Main Menu', slug: 'main-menu' }, token);
                    menusData = await fetchBackofficeNavigation(token);
                } catch { }
            }
            setMenus(menusData);
            const cArr = Array.isArray(catsData) ? catsData : (catsData as any)?.results || [];
            setCategories(cArr);
            if (menusData.length > 0 && !selectedMenuId) setSelectedMenuId(menusData[0].id);
        } catch (err: any) {
            setError(`Failed to load: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) load();
    }, [token, isAuthenticated]);

    const handleAddChild = (parent: NavigationItem) => {
        setEditingItemId(null);
        setAddingChildOf(parent);
        setParentId(parent.id);
        resetForm();
        setIsItemModalOpen(true);
    };

    const handleEditItem = (item: NavigationItem) => {
        setAddingChildOf(null);
        setEditingItemId(item.id);
        setLabel(item.label);
        setParentId(item.parent || "");
        setLinkedCategoryId(item.linked_category_id || "");
        setLinkedUrl(item.linked_url || item.href || "");
        setIsFeatured(item.is_featured);
        setIsActive(item.is_active);
        setIsItemModalOpen(true);
    };

    const handleToggleItemVisibility = async (item: NavigationItem) => {
        if (!token) return;
        try {
            await updateNavigationItem(item.id, { is_active: !item.is_active }, token);
            setSuccess(item.is_active ? `"${item.label}" hidden.` : `"${item.label}" made visible.`);
            load();
            setTimeout(() => setSuccess(null), 3000);
        } catch { setError("Failed to update visibility."); }
    };

    const resetForm = () => {
        setLabel(""); setLinkedCategoryId(""); setLinkedUrl(""); setParentId(""); setIsFeatured(false); setIsActive(true);
        setAddingChildOf(null); setEditingItemId(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !label.trim() || !selectedMenuId) return;
        setIsSaving(true);
        setError(null);
        try {
            const payload = {
                label: label.trim(),
                parent: parentId || null,
                linked_category_id: linkedCategoryId || undefined,
                linked_url: linkedUrl || "",
                is_featured: isFeatured,
                is_active: isActive,
                menu: selectedMenuId,
            };

            if (editingItemId) {
                await updateNavigationItem(editingItemId, payload, token);
            } else {
                await createNavigationItem(payload, token);
            }
            setIsItemModalOpen(false);
            setSuccess("Link saved successfully.");
            setTimeout(() => setSuccess(null), 3000);
            load();
            resetForm();
        } catch (err: any) {
            setError(err.message || "Failed to save item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        if (!token) return;
        confirm({
            title: "Delete Navigation Link?",
            description: "Are you sure? This will permanently remove this link and all associated nested sub-links from your storefront navigation.",
            confirmText: "Delete",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteNavigationItem(id, token);
                    setSuccess("Link removed.");
                    setTimeout(() => setSuccess(null), 3000);
                    load();
                } catch { setError("Failed to delete item."); }
            }
        });
    };

    const handleMenuModalSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !menuName.trim()) return;
        setIsSaving(true);
        try {
            const slug = menuSlug || menuName.toLowerCase().replace(/\s+/g, '-');
            if (editingMenuId) {
                await updateNavigationMenu(editingMenuId, { name: menuName, slug }, token);
            } else {
                const newMenu = await createNavigationMenu({ name: menuName, slug }, token);
                setSelectedMenuId(newMenu.id);
            }
            setIsMenuModalOpen(false);
            setSuccess("Menu settings saved.");
            setTimeout(() => setSuccess(null), 3000);
            load();
        } catch (err: any) {
            setError(err.message || "Failed to save menu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMenu = () => {
        if (!token || !selectedMenuId) return;
        confirm({
            title: "Delete Entire Menu?",
            description: "Warning: This action will permanently delete this menu container and ALL navigation links within it. This cannot be undone.",
            confirmText: "Delete Menu",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteNavigation(selectedMenuId, token);
                    setSuccess("Menu deleted.");
                    setSelectedMenuId("");
                    load();
                } catch { setError("Failed to delete menu."); }
            }
        });
    };

    const menuItems = navItems.filter((item) => !item.parent && item.menu === selectedMenuId);
    const currentMenu = menus.find(m => m.id === selectedMenuId);

    return (
        <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
            <AlertBanner message={error || ""} type="error" onClose={() => setError(null)} />
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">Navigation Builder</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Design the menus your customers use to navigate your store.</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsItemModalOpen(true); }}
                    className="gap-1.5"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Link
                </Button>
            </div>

            {/* Toolbar / Provider-style bar */}
            <div className="border border-slate-200 rounded-md bg-white">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedMenuId}
                            onChange={(e) => setSelectedMenuId(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-900 border-none focus:ring-0 cursor-pointer min-w-[140px]"
                        >
                            {menus.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <div className="h-4 w-px bg-slate-200 mx-1" />
                        <span className="text-[11px] text-slate-400 font-mono tracking-tighter uppercase">
                            /{currentMenu?.slug || "—"}
                        </span>
                        <button
                            onClick={() => { setEditingMenuId(null); setMenuName(""); setMenuSlug(""); setIsMenuModalOpen(true); }}
                            className="p-1 px-2 border border-dashed border-slate-200 rounded text-[10px] font-bold text-slate-400 hover:text-slate-900 hover:border-slate-400 transition ml-2"
                        >
                            + New Menu
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        {selectedMenuId && (
                            <>
                                <button
                                    onClick={() => currentMenu && (setEditingMenuId(currentMenu.id), setMenuName(currentMenu.name), setMenuSlug(currentMenu.slug), setIsMenuModalOpen(true))}
                                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                    title="Menu Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleDeleteMenu}
                                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                    title="Delete Menu"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Search in Tree (Placeholder for now) */}
                <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Filter links…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-0 transition"
                        />
                    </div>
                    <span className="ml-auto text-xs text-slate-400">
                        {navItems.filter(i => i.menu === selectedMenuId).length} Items total
                    </span>
                </div>

                {/* Tree View */}
                <div className="divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                        </div>
                    ) : menuItems.length === 0 ? (
                        <div className="py-16 px-4 text-center">
                            <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                                <Plus className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">This menu is empty</p>
                            <p className="text-xs text-slate-500 mt-1">Start building your navigation by adding the first link.</p>
                            <Button
                                variant="secondary"
                                onClick={() => { resetForm(); setIsItemModalOpen(true); }}
                                className="mt-6"
                            >
                                Add First Link
                            </Button>
                        </div>
                    ) : (
                        menuItems.map((item) => (
                            <NavTreeRow
                                key={item.id}
                                item={item}
                                depth={0}
                                onAddChild={handleAddChild}
                                onDelete={handleDelete}
                                onEdit={handleEditItem}
                                onToggle={handleToggleItemVisibility}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ══ Create/Edit Link Modal ═══════════════════════════════════════ */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setIsItemModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-900">
                                {editingItemId ? "Edit Link" : addingChildOf ? `Add Sub-link to "${addingChildOf.label}"` : "Add Root Link"}
                            </h2>
                            <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="px-5 py-5 space-y-4">
                            <Field label="Link Label" required>
                                <input
                                    required
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="e.g. Menswear"
                                    className={INPUT}
                                    autoFocus
                                />
                            </Field>

                            <div className="space-y-3">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Destination</p>
                                <Field label="Auto-link Category">
                                    <select
                                        value={linkedCategoryId}
                                        onChange={(e) => { setLinkedCategoryId(e.target.value); setLinkedUrl(""); }}
                                        className={INPUT}
                                    >
                                        <option value="">Manual Link / No Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Custom Path / Shortcut">
                                    <div className="space-y-2">
                                        <select
                                            value={SYSTEM_ROUTES.find(r => r.path === linkedUrl)?.path || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) { setLinkedUrl(val); setLinkedCategoryId(""); }
                                                else setLinkedUrl("");
                                            }}
                                            className={INPUT}
                                        >
                                            <option value="">Manual Entry</option>
                                            {SYSTEM_ROUTES.map((route) => (
                                                <option key={route.path} value={route.path}>{route.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            value={linkedUrl}
                                            onChange={(e) => setLinkedUrl(e.target.value)}
                                            placeholder="e.g. /sale or https://..."
                                            disabled={!!linkedCategoryId}
                                            className={`${INPUT} disabled:bg-slate-50`}
                                        />
                                    </div>
                                </Field>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                                <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={(e) => setIsFeatured(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-700">Display as Featured</span>
                                        <span className="text-[10px] text-slate-400">Highlights this item with a star icon</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-700">Visible on Storefront</span>
                                        <span className="text-[10px] text-slate-400">Controls if users can see this link</span>
                                    </div>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setIsItemModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={isSaving}
                                >
                                    {editingItemId ? "Update Link" : "Add Link"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Create/Edit Menu Modal ═══════════════════════════════════════ */}
            {isMenuModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setIsMenuModalOpen(false)} />
                    <div className="relative w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-900">
                                {editingMenuId ? "Menu Settings" : "New Menu"}
                            </h2>
                            <button onClick={() => setIsMenuModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleMenuModalSave} className="px-5 py-5 space-y-4">
                            <Field label="Menu Name" required>
                                <input
                                    required
                                    value={menuName}
                                    onChange={(e) => setMenuName(e.target.value)}
                                    placeholder="e.g. Header Navigation"
                                    className={INPUT}
                                />
                            </Field>
                            <Field label="System Slug">
                                <input
                                    value={menuSlug}
                                    onChange={(e) => setMenuSlug(e.target.value)}
                                    placeholder="e.g. main-menu"
                                    className={INPUT}
                                />
                                <p className="text-[11px] text-slate-400 mt-1 italic">
                                    Used in the frontend to fetch specific menus. Use lowercase with hyphens.
                                </p>
                            </Field>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setIsMenuModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={isSaving}
                                >
                                    Done
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
