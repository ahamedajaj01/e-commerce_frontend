"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { fetchBackofficeProducts, deleteProduct } from "@/lib/api/catalog";
import type { Product } from "@/types/product";
import { PageHeader } from "@/components/backoffice/PageHeader";
import { getProductImage } from "@/lib/utils";
import { DataTable, Column } from "@/components/backoffice/DataTable";
import { StatusBadge } from "@/components/backoffice/StatusBadge";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";

function ProductActions({ product, token, onReload, onError }: { product: Product, token: string | null, onReload: () => void, onError: (msg: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || !confirm(`Are you sure you want to delete ${product.name}?`)) return;
    setIsDeleting(true);
    try {
      await deleteProduct(product.id, token || undefined);
      onReload();
    } catch (err) {
      onError("Failed to delete product");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2 justify-end">
      <Link href={`/backoffice/catalog/${product.id}`}>
        <Button variant="outline" className="h-8 px-3 text-[9px] uppercase font-black tracking-widest border-slate-200">Edit</Button>
      </Link>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all border ${isOpen ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-900'
            }`}
        >
          <span className="text-lg leading-none mb-1">⋮</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-2xl shadow-slate-300/50 rounded-2xl py-3 z-[70] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="px-4 py-1 mb-2 border-b border-slate-50">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</p>
              </div>

              <Link href={`/backoffice/catalog/${product.id}/view`} className="flex items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors">
                <span className="mr-3 opacity-20">👁️</span> View Detail
              </Link>

              <Link href={`/backoffice/catalog/${product.id}`} className="flex items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors">
                <span className="mr-3 opacity-20">✏️</span> Edit Item
              </Link>

              <div className="my-1 border-t border-slate-50" />

              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="w-full flex items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                <span className="mr-3 opacity-20">🗑️</span> {isDeleting ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


export default function CatalogPage() {
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

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

  const columns: Column<Product>[] = [
    {
      header: "Product",
      accessor: (p: Product) => {
        const imageUrl = getProductImage(p);
        return (
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] opacity-20">🖼️</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 truncate uppercase tracking-tight">{p.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{p.slug}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Category",
      accessor: (p: Product) => (
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {p.category_detail?.name || "Uncategorized"}
        </span>
      )
    },
    {
      header: "Pricing",
      accessor: (p: Product) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900">
            NPR {p.base_price || (p as any).price || p.variants?.[0]?.price || "0.00"}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Base Rate</span>
        </div>
      )
    },
    {
      header: "Inventory",
      accessor: (p: Product) => (
        <div className="flex flex-col gap-1">
          <StatusBadge
            status={(p.variants?.length || 0) > 0 ? "active" : "draft"}
          />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
            {p.variants?.length || 0} Variants
          </span>
        </div>
      )
    },
    {
      header: "Actions",
      accessor: (p: Product) => (
        <ProductActions product={p} token={token} onReload={loadProducts} onError={setErrorInfo} />
      ),
      className: "text-right"

    }
  ];

  return (
    <div className="space-y-6">
      <AlertBanner message={errorInfo || ""} onClose={() => setErrorInfo(null)} />
      <PageHeader
        title="Product Catalog"
        subtitle="Manage your fashion inventory, pricing and variant visibility."
        category="Commercial Operations"
        breadcrumbs={[{ label: "Operations" }, { label: "Catalog" }]}
        actions={
          <Link href="/backoffice/catalog/new">
            <Button className="px-6 py-4 text-[10px] uppercase tracking-widest font-black h-auto">
              Add New Product +
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Filter products by name or SKU..."
            className="w-full bg-white border border-slate-200 rounded-xl px-10 py-3 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
        </div>
        <Button variant="outline" className="h-full py-3 px-6 text-[10px] uppercase tracking-widest font-black h-auto border-slate-200">
          Export .CSV
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        data={products}
        columns={columns}
      />
    </div>
  );
}
