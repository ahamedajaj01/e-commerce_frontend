"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { fetchBackofficeCategories, deleteCategory } from "@/lib/api/catalog";
import type { Category } from "@/types/product";
import { PageHeader } from "@/components/backoffice/PageHeader";
import { DataTable, Column } from "@/components/backoffice/DataTable";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { getMediaUrl } from "@/lib/utils";

function CategoryActions({
    category,
    token,
    onReload,
    onError,
}: {
    category: Category;
    token: string | null;
    onReload: () => void;
    onError: (msg: string) => void;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!token || !confirm(`Delete category "${category.name}"? This may affect products assigned to it.`)) return;
        setIsDeleting(true);
        try {
            await deleteCategory(category.id, token);
            onReload();
        } catch (err: any) {
            onError(err.message || "Failed to delete category.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex items-center gap-2 justify-end">
            <Link href={`/backoffice/categories/${category.id}/edit`}>
                <Button variant="outline" className="h-8 px-3 text-[9px] uppercase font-black tracking-widest">
                    Edit
                </Button>
            </Link>
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition disabled:opacity-50"
            >
                {isDeleting ? "…" : "Delete"}
            </button>
        </div>
    );
}

export default function CategoriesPage() {
    const { token, isAuthenticated } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);

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

    const columns: Column<Category>[] = [
        {
            header: "Category Name",
            accessor: (c: any) => (
                <div className="flex items-center gap-4" style={{ paddingLeft: c.depth ? `${c.depth * 2}rem` : '0' }}>
                    {c.depth > 0 && <span className="text-slate-300 font-bold -mr-2">└</span>}
                    <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {c.image ? (
                            <img src={getMediaUrl(c.image)} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-lg opacity-20">📁</span>
                        )}
                    </div>
                    <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.slug}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Parent",
            accessor: (c: any) => {
                const parentName = c.depth > 0 ? (categories.find(cat => cat.id === c.parent)?.name || "(Parent Category)") : "—";
                return (
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        {parentName}
                    </span>
                );
            }
        },
        {
            header: "Status",
            accessor: (c: Category) => {
                const active = c.is_active !== false; // default to active if not returned
                return (
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${active ? "text-emerald-600" : "text-slate-400"}`}>
                            {active ? "Active" : "Inactive"}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Actions",
            accessor: (c: Category) => (
                <CategoryActions
                    category={c}
                    token={token}
                    onReload={loadCategories}
                    onError={setErrorInfo}
                />
            ),
            className: "text-right"
        }
    ];

    return (
        <div className="space-y-6">
            <AlertBanner message={errorInfo || ""} onClose={() => setErrorInfo(null)} />

            <PageHeader
                title="Category Management"
                subtitle="Organize your product hierarchy and navigation structure."
                category="Commercial Operations"
                breadcrumbs={[{ label: "Operations" }, { label: "Categories" }]}
                actions={
                    <Link href="/backoffice/categories/new">
                        <Button className="px-6 py-4 text-[10px] uppercase tracking-widest font-black h-auto">
                            Create Category +
                        </Button>
                    </Link>
                }
            />

            <DataTable
                isLoading={isLoading}
                data={categories}
                columns={columns}
            />
        </div>
    );
}
