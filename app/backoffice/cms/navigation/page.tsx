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
import { AlertBanner } from "@/components/ui/AlertBanner";
import Link from "next/link";
import { ArrowLeft, Plus, X, Trash2, ChevronRight, Compass, Star, Zap, Settings, Edit3 } from "lucide-react";

const SYSTEM_ROUTES = [
    { name: "New Arrivals", path: "/collections/new-arrivals" },
    { name: "Trending Now", path: "/collections/trending" },
    { name: "Best Sellers", path: "/collections/best-sellers" },
    { name: "Exclusive Collections", path: "/collections/exclusive" },
];

// Recursive component to render nav items as a visual tree
function NavTreeItem({
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
        <div style={{ marginLeft: depth * 20 }}>
            <div className={`flex items-center justify-between p-4 rounded-2xl border transition mb-2 group
        ${depth === 0 ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-50 border-slate-100 hover:border-slate-200"}
        ${item.is_active === false ? "opacity-60 grayscale-[0.5]" : ""}`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => onToggle(item)}
                        title={item.is_active !== false ? "Hide from Menu" : "Show in Menu"}
                        className={`p-1.5 rounded-lg transition ${item.is_active !== false ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-300 hover:bg-slate-100"}`}
                    >
                        {item.is_active !== false ? <Zap className="w-3.5 h-3.5 fill-emerald-500" /> : <Zap className="w-3.5 h-3.5" />}
                    </button>
                    {depth > 0 && <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
                    {item.is_featured && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                    <div className="min-w-0">
                        <p className={`text-sm font-black truncate ${item.is_active === false ? "text-slate-400 line-through" : "text-slate-900"}`}>{item.label}</p>
                        {item.category_slug && (
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">→ /{item.category_slug}</p>
                        )}
                        {item.href && !item.category_slug && (
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">{item.href}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                        onClick={() => onEdit(item)}
                        title="Edit Item"
                        className="p-1.5 rounded-xl text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onAddChild(item)}
                        title="Add child item"
                        className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-fuchsia-600 bg-fuchsia-50 rounded-xl hover:bg-fuchsia-100 transition flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Child
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            {item.children?.map((child) => (
                <NavTreeItem
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

export default function NavigationPage() {
    const { token, isAuthenticated } = useAuth();

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

    // Form state: Editing Item
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    // Form state: Navigation Menu
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [menuName, setMenuName] = useState("");
    const [menuSlug, setMenuSlug] = useState("");
    const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

    const [addingChildOf, setAddingChildOf] = useState<NavigationItem | null>(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);

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
            // If no menus exist, attempt to create a default one
            let menusData = menusDataRaw;
            if (menusData.length === 0) {
                try {
                    await createNavigationMenu({ name: 'Main Menu', slug: 'main-menu' }, token);
                    // re-fetch menus after creation
                    menusData = await fetchBackofficeNavigation(token);
                } catch (menuErr: any) {
                    console.warn("[Navigation] Could not auto-create default menu:", menuErr?.message);
                    // Page still loads — user can manually create a menu
                }
            }
            setMenus(menusData);
            const cArr = Array.isArray(catsData) ? catsData : (catsData as any)?.results || [];
            setCategories(cArr);
            if (menusData.length > 0 && !selectedMenuId) setSelectedMenuId(menusData[0].id);
        } catch (err: any) {
            console.error("Full navigation load error:", err);
            const detail = err.data ? JSON.stringify(err.data) : "";
            setError(`Failed to load navigation data: ${err.message}. ${detail}`);
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
        setLabel(""); setLinkedCategoryId(""); setLinkedUrl(""); setIsFeatured(false); setIsActive(true);
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
        } catch { setError("Failed to update visibility."); }
    };


    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !label.trim()) { setError("Menu item label is required."); return; }
        if (!selectedMenuId) { setError("No navigation menu found. Please wait for the page to finish loading."); return; }
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
                setSuccess("Item updated successfully!");
            } else {
                await createNavigationItem(payload, token);
                setSuccess(addingChildOf ? `Child item added under "${addingChildOf.label}"!` : "Navigation item created!");
            }

            setLabel(""); setLinkedCategoryId(""); setLinkedUrl(""); setParentId(""); setIsFeatured(false); setIsActive(true);
            setAddingChildOf(null); setEditingItemId(null);
            setIsItemModalOpen(false);
            load();
        } catch (err: any) {
            setError(err.message || "Failed to save item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!token || !confirm("Delete this menu item and all its children?")) return;
        try {
            await deleteNavigationItem(id, token);
            setSuccess("Item removed.");
            load();
        } catch { setError("Failed to delete item."); }
    };

    const handleMenuModalSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !menuName.trim()) return;
        setIsSaving(true);
        try {
            const slug = menuSlug || menuName.toLowerCase().replace(/\s+/g, '-');
            if (editingMenuId) {
                await updateNavigationMenu(editingMenuId, { name: menuName, slug }, token);
                setSuccess("Menu updated!");
            } else {
                const newMenu = await createNavigationMenu({ name: menuName, slug }, token);
                setSelectedMenuId(newMenu.id);
                setSuccess("New menu created!");
            }
            setIsMenuModalOpen(false);
            setMenuName(""); setMenuSlug(""); setEditingMenuId(null);
            load();
        } catch (err: any) {
            setError(err.message || "Failed to save menu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditMenu = (menu: NavigationMenu) => {
        setEditingMenuId(menu.id);
        setMenuName(menu.name);
        setMenuSlug(menu.slug);
        setIsMenuModalOpen(true);
    };

    const handleDeleteMenu = async () => {
        if (!token || !selectedMenuId || !confirm("Delete this entire menu? All its items will be lost!")) return;
        try {
            await deleteNavigation(selectedMenuId, token);
            setSuccess("Menu deleted.");
            setSelectedMenuId("");
            load();
        } catch { setError("Failed to delete menu."); }
    };

    return (
        <div className="space-y-8">
            {/* Display success or error briefly */}
            {error && (
                <AlertBanner message={error} type="error" onClose={() => setError(null)} />
            )}
            {success && (
                <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />
            )}

            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <Link href="/backoffice/dashboard" className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 rounded-2xl">
                        <Compass className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Navigation Builder</h1>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Design the menus your customers use to explore your store</p>
                    </div>
                </div>
            </div>

            {/* Menu Management Bar */}
            <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-2 overflow-hidden">
                <div className="flex-1 flex items-center gap-2 px-4">
                    <Compass className="w-5 h-5 text-amber-500" />
                    <select
                        value={selectedMenuId}
                        onChange={(e) => setSelectedMenuId(e.target.value)}
                        className="bg-transparent text-sm font-black text-slate-900 border-none focus:ring-0 cursor-pointer min-w-[150px] uppercase tracking-widest"
                    >
                        {menus.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    {selectedMenuId && (
                        <div className="flex items-center gap-4 ml-4 py-1 px-4 border-l border-slate-100 hidden md:flex">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Zap className="w-3 h-3 text-amber-400" /> {menus.find(m => m.id === selectedMenuId)?.slug}
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {navItems.filter(i => i.menu === selectedMenuId).length} Items
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 pr-2">
                    {selectedMenuId && (
                        <>
                            <button
                                onClick={() => handleEditMenu(menus.find(m => m.id === selectedMenuId)!)}
                                className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-2xl transition"
                                title="Menu Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleDeleteMenu}
                                className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition"
                                title="Delete Menu"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => { setEditingItemId(null); setAddingChildOf(null); setLabel(""); setLinkedCategoryId(""); setLinkedUrl(""); setParentId(""); setIsItemModalOpen(true); }}
                        className="ml-2 px-6 py-3 rounded-[1.5rem] bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition"
                    >
                        <Plus className="w-3 h-3 inline mr-1" /> Add Link
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full space-y-12 pb-20">
                {/* Navigation Tree Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">
                            Site Structure
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                        </div>
                    ) : navItems.length === 0 ? (
                        <div className="rounded-[3rem] border-2 border-dashed border-slate-100 p-20 text-center bg-white">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Compass className="w-8 h-8 text-slate-200" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">No Links in this Menu</h3>
                            <p className="text-sm font-medium text-slate-400 mb-8 max-w-xs mx-auto">Start building your navigation by adding categories or custom pages.</p>
                            <button
                                onClick={() => { setEditingItemId(null); setAddingChildOf(null); setIsItemModalOpen(true); }}
                                className="px-10 py-4 rounded-2xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition"
                            >
                                <Plus className="w-3 h-3 inline mr-2" /> Add First Link
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] border border-slate-100 p-2 shadow-sm">
                            <div className="space-y-1">
                                {navItems
                                    .filter((item) => !item.parent && item.menu === selectedMenuId)
                                    .map((item) => (
                                        <NavTreeItem
                                            key={item.id}
                                            item={item}
                                            depth={0}
                                            onAddChild={handleAddChild}
                                            onDelete={handleDelete}
                                            onEdit={handleEditItem}
                                            onToggle={handleToggleItemVisibility}
                                        />
                                    ))}
                            </div>

                            {/* Bottom Add shortcut */}
                            <button
                                onClick={() => { setEditingItemId(null); setAddingChildOf(null); setIsItemModalOpen(true); }}
                                className="w-full py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-amber-500 hover:bg-amber-50/30 transition group flex items-center justify-center gap-2 mt-2"
                            >
                                <Plus className="w-4 h-4 group-hover:scale-110 transition" /> Add Root Link
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Item Studio Modal */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-amber-50 rounded-[1.5rem]">
                                    {editingItemId ? <Edit3 className="w-6 h-6 text-amber-500" /> : <Plus className="w-6 h-6 text-amber-500" />}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-slate-900 leading-none">
                                        {editingItemId ? "Link Studio" : addingChildOf ? "New Sub-Link" : "New Root Link"}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {addingChildOf ? `Parent: ${addingChildOf.label}` : "Adding to Main Structure"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsItemModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-x-10 gap-y-8">
                            {/* Left Column: Info */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">Menu Label</label>
                                    <input
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        placeholder="e.g. New Arrivals"
                                        className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-200"
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">Appearance Settings</label>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsFeatured(!isFeatured)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isFeatured ? "bg-amber-50 border-amber-200 ring-2 ring-amber-100" : "bg-white border-slate-100 hover:border-slate-200"}`}
                                        >
                                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                <Star className={`w-4 h-4 ${isFeatured ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} /> Featured Status
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ opacity: isFeatured ? 1 : 0 }} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setIsActive(!isActive)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-50" : "bg-white border-slate-100 hover:border-slate-200"}`}
                                        >
                                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                <Zap className={`w-4 h-4 ${isActive ? "text-emerald-500 fill-emerald-500" : "text-slate-300"}`} /> Visible on Store
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" style={{ opacity: isActive ? 1 : 0 }} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Destination */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">System Shortcut</label>
                                    <select
                                        value={SYSTEM_ROUTES.find(r => r.path === linkedUrl)?.path || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val) { setLinkedUrl(val); setLinkedCategoryId(""); }
                                            else setLinkedUrl("");
                                        }}
                                        className="w-full rounded-2xl bg-fuchsia-50/30 border border-fuchsia-100 p-5 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-fuchsia-200 text-fuchsia-700"
                                    >
                                        <option value="">-- Manual Link --</option>
                                        {SYSTEM_ROUTES.map((route) => (
                                            <option key={route.path} value={route.path}>{route.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">Or : Select Category</label>
                                    <select
                                        value={linkedCategoryId}
                                        onChange={(e) => { setLinkedCategoryId(e.target.value); setLinkedUrl(""); }}
                                        className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-amber-200"
                                    >
                                        <option value="">-- No Category --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">Or : Custom Path/URL</label>
                                    <input
                                        value={linkedUrl}
                                        onChange={(e) => setLinkedUrl(e.target.value)}
                                        placeholder="e.g. /sale"
                                        disabled={!!linkedCategoryId}
                                        className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-30"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsItemModalOpen(false)}
                                    className="px-8 py-5 rounded-2xl bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-12 py-5 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-2xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : editingItemId ? "Save Updates" : "Add to Menu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create/Edit Menu Modal */}
            {isMenuModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-amber-50 rounded-2xl">
                                <Settings className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{editingMenuId ? "Menu Studio" : "New Menu"}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure Menu Container</p>
                            </div>
                        </div>

                        <form onSubmit={handleMenuModalSave} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">Menu Name</label>
                                <input
                                    value={menuName}
                                    onChange={(e) => setMenuName(e.target.value)}
                                    placeholder="e.g. Master Navigation"
                                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-200"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">System Slug</label>
                                <input
                                    value={menuSlug}
                                    onChange={(e) => setMenuSlug(e.target.value)}
                                    placeholder="e.g. main-nav"
                                    className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-200"
                                />
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 p-2 rounded-lg mt-2 italic">⚠️ Do not change if this is your active site menu.</p>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setIsMenuModalOpen(false)}
                                    className="flex-1 py-5 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-2 px-10 py-5 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-100 hover:bg-slate-800 transition disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Done"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
