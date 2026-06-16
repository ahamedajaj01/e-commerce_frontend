"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/providers/ModalProvider";
import { fetchBackofficeProducts, deleteProduct } from "@/lib/api/catalog";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/product";
import { getProductImage } from "@/lib/utils";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Download,
  Filter,
  Package,
  ChevronRight,
  Loader2
} from "lucide-react";

export default function CatalogPage() {
  const { token, isAuthenticated } = useAuth();
  const { confirm } = useModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadProducts = () => {
    setIsLoading(true);
    fetchBackofficeProducts(token || undefined)
      .then((data: any) => {
        const results = Array.isArray(data) ? data : data?.results || [];
        setProducts(results);
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadProducts();
    }
  }, [token, isAuthenticated]);

  const handleDelete = (id: string, name: string) => {
    if (!token) return;
    confirm({
      title: "Delete Product?",
      description: `This action cannot be undone. "${name}" will be permanently removed from the catalog.`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteProduct(id, token || undefined);
          setSuccess("Product removed from catalog.");
          loadProducts();
        } catch {
          setErrorInfo("Failed to remove product.");
        }
      }
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-8 space-y-10 animate-in fade-in duration-300">
      {errorInfo && <AlertBanner message={errorInfo} type="error" onClose={() => setErrorInfo(null)} />}
      {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

      {/* HEADER */}
      <div className="flex items-end justify-between border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your store inventory, commercial pricing, and global storefront visibility.</p>
        </div>
        <Link href="/backoffice/catalog/new">
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* MANAGEMENT TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Inventory</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by name or SKU..."
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium w-64 outline-none focus:border-slate-400 transition-all"
              />
            </div>
            <button className="px-4 py-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 rounded-md hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-2">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden min-h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[40%]">Product Identity</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pricing</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collection</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-sm text-slate-400 font-medium">Synchronizing catalog assets...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-sm text-slate-400 font-medium">No inventory items found matching your search.</td></tr>
              ) : (
                filteredProducts.map((p) => {
                  const active = (p.variants?.length || 0) > 0;
                  const img = getProductImage(p);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded border bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                            {img ? (
                              <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[13px] font-bold text-slate-900 block truncate leading-none">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 inline-block">SKU: {p.slug.split('-')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-[12px] font-bold text-slate-900 block">NPR {p.base_price || "0.00"}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Base Rate</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-900 block">{(p as any).brand_detail?.name || p.brand || "In-House"}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{p.category_detail?.name || "Uncategorized"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {active ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">Live</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200">Draft</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <Link href={`/backoffice/catalog/${p.id}`} className="text-[11px] font-bold text-slate-950 hover:underline">Edit</Link>
                          <Link href={`/backoffice/catalog/${p.id}/view`} className="text-[11px] font-bold text-slate-400 hover:text-slate-900">View</Link>
                          <button onClick={() => handleDelete(p.id, p.name)} className="text-[11px] font-bold text-rose-600 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* OPERATIONAL SUMMARY */}
        <div className="h-12 flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-t pt-4">
          <span>Showing {filteredProducts.length} Inventory Records</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {products.filter(p => (p.variants?.length || 0) > 0).length} Production Ready</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> {products.filter(p => (p.variants?.length || 0) === 0).length} Awaiting Stock</span>
          </div>
        </div>
      </div>
    </div>
  );
}
