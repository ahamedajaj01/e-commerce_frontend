"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { fetchBackofficeCategories, updateCategory } from "@/lib/api/catalog";
import type { Category } from "@/types/product";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [category, setCategory] = useState<Category | null>(null);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const flattenCategories = (cats: any[]): any[] => {
            let result: any[] = [];
            cats.forEach((c) => {
                result.push(c);
                if (c.children && c.children.length > 0) {
                    result = result.concat(flattenCategories(c.children));
                }
            });
            return result;
        };

        fetchBackofficeCategories(token)
            .then((data: any) => {
                const rawResults = Array.isArray(data) ? data : data?.results || [];
                const flatResults = flattenCategories(rawResults);
                setAllCategories(flatResults);
                const found = flatResults.find(c => c.id === id) || null;
                setCategory(found);
            })
            .catch(() => setErrorInfo("Failed to load categories."))
            .finally(() => setFetching(false));
    }, [id, token]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token || !category) return;
        setLoading(true);
        setErrorInfo(null);

        const formData = new FormData(e.currentTarget);
        const name = (formData.get("name") as string)?.trim();
        const parentId = formData.get("parent_id") as string | null;

        if (!name) {
            setErrorInfo("Category name is required.");
            setLoading(false);
            return;
        }

        try {
            await updateCategory(id, { name, parent_id: parentId || null }, token);
            router.push("/backoffice/categories");
            router.refresh();
        } catch (err: any) {
            console.error("Failed to update category:", err);
            setErrorInfo(err.message || "Failed to update category. Please try again.");
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

    if (!category) {
        return (
            <div className="space-y-4">
                <AlertBanner message={errorInfo || "Category not found."} />
                <Button variant="outline" onClick={() => router.back()}>← Back</Button>
            </div>
        );
    }

    // Exclude the current category from the parent options (can't parent to self)
    const parentOptions = allCategories.filter(c => c.id !== id);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AlertBanner message={errorInfo || ""} onClose={() => setErrorInfo(null)} />

            {/* Header */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-[10px] uppercase tracking-widest font-black text-slate-400 hover:text-slate-900 transition flex items-center gap-2 mb-6"
                >
                    ← Back to Categories
                </button>
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-fuchsia-600">Category Studio</p>
                <h1 className="mt-4 text-4xl font-black text-slate-900 leading-tight">Edit Category</h1>
                <p className="mt-2 text-sm text-slate-400 font-medium">
                    Slug: <code className="bg-slate-100 px-2 py-0.5 rounded-lg text-xs">{category.slug}</code>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-3">
                {/* Main Fields */}
                <div className="lg:col-span-2">
                    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Essential Details</h3>
                        <div className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                                    Category Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    required
                                    type="text"
                                    defaultValue={category.name}
                                    placeholder="e.g. Ladies Kurti"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
                                />
                            </div>

                            {/* Parent Category */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                                    Parent Category <span className="text-slate-300 font-medium normal-case">(optional)</span>
                                </label>
                                <select
                                    name="parent_id"
                                    defaultValue={category.parent_id || ""}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
                                >
                                    <option value="">None (Top-level category)</option>
                                    {parentOptions.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name} {cat.parent ? '(Sub)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-10">
                    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 text-[10px] uppercase tracking-widest font-black h-auto"
                        >
                            {loading ? "Saving..." : "Save Changes →"}
                        </Button>
                        <p className="text-center text-[10px] text-slate-400 font-medium italic">
                            Updating this category will affect all associated products immediately.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
