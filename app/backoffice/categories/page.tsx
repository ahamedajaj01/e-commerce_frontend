"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { fetchBackofficeCategories, deleteCategory } from "@/lib/api/catalog";
import type { Category } from "@/types/product";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { getMediaUrl } from "@/lib/utils";
import {
    Plus,
    Search,
    Folder,
    ExternalLink,
    Trash2,
    ChevronRight,
    MoreVertical,
    Layers
} from "lucide-react";

export default function CategoriesPage() {
    const { token, isAuthenticated } = useAuth();
    const { confirm } = useModal();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const flattenCategories = (cats: any[], depth = 0): any[] => {
        let result: any[] = [];
        cats.forEach((c) => {
            result.push({ ...c, depth });
            if (c.children && c.children.length > 0) {
                result = result.concat(flattenCategories(c.children, depth + 1));
            }
        });
        return result;
    };

    const loadCategories = () => {
        if (!isAuthenticated || !token) return;
        setIsLoading(true);
        fetchBackofficeCategories(token)
            .then((data: any) => {
                const results = Array.isArray(data) ? data : data?.results || [];
                setCategories(flattenCategories(results));
            })
            .catch(() => setCategories([]))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadCategories();
    }, [token, isAuthenticated]);

    const handleDelete = (category: Category) => {
        if (!token) return;
        confirm({
            title: "Delete Category?",
            description: `This action cannot be undone. deleting "${category.name}" may affect associated products and subcategories.`,
            confirmText: "Delete",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await deleteCategory(category.id, token);
                    setSuccess("Category removed.");
                    loadCategories();
                } catch {
                    setErrorInfo("Failed to remove category.");
                }
            }
        });
    };

    return (
        <div className="max-w-[1400px] mx-auto py-8 px-8 space-y-10 animate-in fade-in duration-300">
            {errorInfo && <AlertBanner message={errorInfo} type="error" onClose={() => setErrorInfo(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* HEADER */}
            <div className="flex items-end justify-between border-b pb-6">
                <div className="space-y-1">
                    <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Category Management</h1>
                    <p className="text-sm text-slate-500 font-medium">Organize your product hierarchy and storefront navigation structure.</p>
                </div>
                <Link href="/backoffice/categories/new">
                    <Button variant="primary" className="gap-2">
                        <Plus className="w-4 h-4" /> Create Category
                    </Button>
                </Link>
            </div>

            {/* MANAGEMENT TABLE */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hierarchy Explorer</h2>
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        <input placeholder="Filter by category..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium w-48 outline-none" />
                    </div>
                </div>

                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b">
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-1/2">Category Name</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Internal Path</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={4} className="px-6 py-20 text-center text-sm text-slate-400 font-medium">Mapping product hierarchy...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-20 text-center text-sm text-slate-400 font-medium">No categories found in registry.</td></tr>
                            ) : (
                                categories.map((cat) => {
                                    const active = cat.is_active !== false;
                                    return (
                                        <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div
                                                    className="flex items-center gap-4"
                                                    style={{ paddingLeft: `${cat.depth * 2}rem` }}
                                                >
                                                    {cat.depth > 0 && <span className="text-slate-300 font-bold -mr-2">└</span>}
                                                    <div className="h-9 w-9 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                        {cat.image ? (
                                                            <img src={getMediaUrl(cat.image)} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                                        ) : (
                                                            <Folder className="w-3.5 h-3.5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-[13px] font-bold text-slate-900 block leading-none">{cat.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 inline-block">ID: {cat.id.split('-')[0]}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">Active</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200">Hidden</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">/catalog/{cat.slug}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Link href={`/backoffice/categories/${cat.id}/edit`} className="text-[11px] font-bold text-slate-950 hover:underline">Edit</Link>
                                                    <button onClick={() => handleDelete(cat)} className="text-[11px] font-bold text-rose-600 hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* OPERATIONAL FOOTER */}
                <div className="mt-8 flex items-center gap-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <div className="h-10 w-10 bg-white rounded border flex items-center justify-center shadow-sm">
                        <Layers className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xs font-bold text-slate-900 uppercase">Strategic Organization</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Categories defined here power your storefront navigation and the <span className="text-slate-900 font-bold">Rule-based Selection</span> in the Campaign Merchandising dashboard.
                        </p>
                    </div>
                    <Link href="/backoffice/catalog" className="text-[10px] font-black uppercase text-slate-900 hover:underline flex items-center gap-2">
                        View Product Registry <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
