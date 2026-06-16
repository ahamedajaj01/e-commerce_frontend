"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchInventory,
  adjustInventory,
  type InventoryItem,
  type MovementType,
} from "@/lib/api/inventory";
import {
  Search,
  RefreshCcw,
  Pencil,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "IN", label: "Stock In" },
  { value: "OUT", label: "Stock Out" },
  { value: "RETURN", label: "Return" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function stockStatus(item: InventoryItem): "out" | "low" | "ok" {
  if (item.is_unlimited) return "ok";
  if (item.available_quantity === 0) return "out";
  if (item.available_quantity <= item.low_stock_threshold) return "low";
  return "ok";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockBadge({ item }: { item: InventoryItem }) {
  if (item.is_unlimited) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
        ∞ Unlimited
      </span>
    );
  }
  const s = stockStatus(item);
  const cfg = {
    out: { bg: "bg-rose-50 text-rose-700", dot: "bg-rose-500", label: "Out of Stock" },
    low: { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-500", label: "Low Stock" },
    ok: { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", label: "In Stock" },
  }[s];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number | string; highlight?: "warning" | "danger" }) {
  const color = highlight === "danger" ? "text-rose-600" : highlight === "warning" ? "text-amber-600" : "text-slate-900";
  return (
    <div className="border border-slate-200 rounded-md bg-white px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

const INPUT = "w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition placeholder:text-slate-300";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { token, isAuthenticated } = useAuth();

  // Data
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "LOW" | "OUT">("ALL");
  const [page, setPage] = useState(1);

  // Adjust modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState(0);
  const [movementType, setMovementType] = useState<MovementType>("ADJUSTMENT");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // ─── Data loading ─────────────────────────────────────────────────────────

  const load = async (silent = false) => {
    if (!isAuthenticated || !token) return;
    if (!silent) setIsLoading(true);
    try {
      const res = await fetchInventory(token, undefined, page, debouncedSearch);
      setItems(res.items);
      setTotalItems(res.count);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [token, isAuthenticated, page, debouncedSearch]);

  // Reset to page 1 on new search
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // ─── Derived stats ────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const s = stockStatus(item);
      if (filterStatus === "LOW") return s === "low";
      if (filterStatus === "OUT") return s === "out";
      return true;
    });
  }, [items, filterStatus]);

  const inStockCount = items.filter((i) => stockStatus(i) === "ok").length;
  const lowCount = items.filter((i) => stockStatus(i) === "low").length;
  const outCount = items.filter((i) => stockStatus(i) === "out").length;

  // ─── Adjust handlers ──────────────────────────────────────────────────────

  const openAdjust = (item: InventoryItem) => {
    setEditingItem(item);
    setNewQuantity(item.available_quantity);
    setMovementType("ADJUSTMENT");
    setNote("");
    setAdjustError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !token) return;

    const delta = newQuantity - editingItem.available_quantity;
    if (delta === 0) { setEditingItem(null); return; }

    const absDelta = Math.abs(delta);
    let finalType = movementType;
    if (delta > 0 && finalType === "OUT") finalType = "IN";
    if (delta < 0) finalType = "OUT";

    setIsSaving(true);
    setAdjustError(null);
    try {
      await adjustInventory(editingItem.id, absDelta, finalType, note || undefined, token);
      setEditingItem(null);
      load(true);
    } catch {
      setAdjustError("Adjustment failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">
            Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage stock levels, inventory tracking, and product availability.
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 px-3 py-2 rounded-md text-sm hover:border-slate-400 hover:text-slate-900 transition disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total SKUs" value={totalItems} />
        <StatCard label="In Stock" value={inStockCount} />
        <StatCard label="Low Stock" value={lowCount} highlight={lowCount > 0 ? "warning" : undefined} />
        <StatCard label="Out of Stock" value={outCount} highlight={outCount > 0 ? "danger" : undefined} />
      </div>

      {/* ── Table Card ───────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-md bg-white overflow-hidden">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products or SKUs…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-md p-0.5 bg-slate-50">
            {(["ALL", "LOW", "OUT"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${filterStatus === s
                    ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {s === "ALL" ? "All" : s === "LOW" ? "Low Stock" : "Out of Stock"}
              </button>
            ))}
          </div>

          {/* Row count */}
          <span className="ml-auto text-xs text-slate-400">
            {totalItems} SKU{totalItems !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Product", "SKU", "Variant", "Available", "Reserved", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap last:text-right"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(7).fill(0).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 bg-slate-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    {items.length === 0
                      ? "No inventory records found."
                      : "No items match the current filter."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const s = stockStatus(item);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors group ${s === "out" ? "bg-rose-50/30" : s === "low" ? "bg-amber-50/20" : ""
                        }`}
                    >
                      {/* Product */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-900 truncate max-w-[180px]">
                            {item.product_name}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-2.5">
                        <code className="text-xs text-slate-500 font-mono">
                          {item.sku || "—"}
                        </code>
                      </td>

                      {/* Variant */}
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-slate-500">
                          {item.variant_info || "Standard"}
                        </span>
                      </td>

                      {/* Available */}
                      <td className="px-4 py-2.5">
                        <span className={`text-sm font-semibold ${s === "out" ? "text-rose-700" :
                            s === "low" ? "text-amber-700" :
                              "text-slate-900"
                          }`}>
                          {item.is_unlimited ? "∞" : item.available_quantity}
                        </span>
                      </td>

                      {/* Reserved */}
                      <td className="px-4 py-2.5">
                        <span className="text-sm text-slate-500">
                          {item.reserved_quantity ?? 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5">
                        <StockBadge item={item} />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => openAdjust(item)}
                          title="Adjust stock"
                          className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition opacity-0 group-hover:opacity-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalItems)} of {totalItems}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0 }); }}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 text-xs text-slate-600 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0 }); }}
                className="p-1.5 rounded border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ Adjust Stock Modal ═══════════════════════════════════════════ */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setEditingItem(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Adjust Stock</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{editingItem.sku}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="px-5 py-5 space-y-4">

              {adjustError && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-md px-3 py-2.5 text-sm text-rose-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {adjustError}
                </div>
              )}

              {/* Current vs new */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Current</p>
                  <p className="text-xl font-semibold text-slate-700">
                    {editingItem.available_quantity}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Delta</p>
                  <p className={`text-xl font-semibold ${newQuantity > editingItem.available_quantity
                      ? "text-emerald-600"
                      : newQuantity < editingItem.available_quantity
                        ? "text-rose-600"
                        : "text-slate-400"
                    }`}>
                    {newQuantity > editingItem.available_quantity ? "+" : ""}
                    {newQuantity - editingItem.available_quantity}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  New Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className={INPUT}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Movement Type</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as MovementType)}
                    className={INPUT}
                  >
                    {MOVEMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Note</label>
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-60 transition"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
