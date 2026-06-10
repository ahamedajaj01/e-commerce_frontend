"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { createCategory, fetchBackofficeCategories } from "@/lib/api/catalog";
import type { Category } from "@/types/product";

export default function NewCategoryPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);
    const [parentCategories, setParentCategories] = useState<Category[]>([]);

    // Load existing categories to allow selecting a parent
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
                const results = Array.isArray(data) ? data : data?.results || [];
                setParentCategories(flattenCategories(results));
            })
            .catch(() => { }); // Non-fatal — just skip the parent selector
    }, [token]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) return;
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
            // Send exactly what the backend expects: name + optional parent_id
            await createCategory(
                { name, parent_id: parentId || null },
                token
            );
            router.push("/backoffice/categories");
            router.refresh();
        } catch (err: any) {
            console.error("Failed to create category:", err);
            setErrorInfo(err.message || "Failed to create category. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AlertBanner message={errorInfo || ""} onClose={() => setErrorInfo(null)} />

            {/* Header Card */}
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-[10px] uppercase tracking-widest font-black text-slate-400 hover:text-slate-900 transition flex items-center gap-2 mb-6"
                >
                    &larr; Back to Categories
                </button>
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-fuchsia-600">Category Studio</p>
                <h1 className="mt-4 text-4xl font-black text-slate-900 leading-tight">Create New Category</h1>
                <p className="mt-2 text-sm text-slate-400">Slug is auto-generated from the name by the backend.</p>
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500/10 transition"
                                >
                                    <option value="">None (Top-level category)</option>
                                    {parentCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name} {cat.parent ? '(Sub)' : ''}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 font-medium italic">
                                    Set a parent to create a subcategory. E.g. "Printed" under "Kurti".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar actions */}
                <div className="space-y-10">
                    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 space-y-6">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 text-[10px] uppercase tracking-widest font-black h-auto"
                        >
                            {loading ? "Creating..." : "Create Category →"}
                        </Button>
                        <p className="text-center text-[10px] text-slate-400 font-medium italic">
                            Products can be assigned to this category immediately after creation.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
