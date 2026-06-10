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
  Package,
  AlertTriangle,
  Search,
  RefreshCcw,
  Edit3,
  X,
  History,
  Activity,
  Box,
  ChevronRight,
  Settings2,
  SlidersHorizontal,
  Eraser,
  Check
} from "lucide-react";

// Helper for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: "IN", label: "Inventory IN" },
  { value: "OUT", label: "Inventory OUT" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "RETURN", label: "Return" },
];

export default function InventoryPage() {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [filterStatus, setFilterStatus] = useState<"ALL" | "LOW" | "OUT">("ALL");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState(0);
  const [movementType, setMovementType] = useState<MovementType>("ADJUSTMENT");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter System
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeSearch, setActiveSearch] = useState("");
  const [tempSearch, setTempSearch] = useState(""); // Holds value in modal before applying


  // Global Metadata
  const [globalCriticalCount, setGlobalCriticalCount] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 20; // Dashboard default
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const load = async () => {
    if (!isAuthenticated || !token) return;
    setIsLoading(true);
    setItems([]);

    try {
      const [invRes, lowRes] = await Promise.all([
        fetchInventory(token, undefined, page, activeSearch),
        fetchInventory(token, undefined, 1),
      ]);

      setItems(invRes.items);
      setTotalItems(invRes.count);

      setGlobalCriticalCount(invRes.items.filter(i => i.available_quantity <= i.low_stock_threshold).length);
    } catch {
      setError("Failed to synchronize inventory data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, isAuthenticated, page, activeSearch]);

  // Reset to first page when search changes to show correct top results
  useEffect(() => {
    setPage(1);
  }, [activeSearch]);

  const handleApplyFilters = () => {
    setActiveSearch(tempSearch);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setTempSearch("");
    setActiveSearch("");
    setIsFilterModalOpen(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const isLow = item.available_quantity > 0 && item.available_quantity <= item.low_stock_threshold;
      const isOut = item.available_quantity === 0;

      if (filterStatus === "LOW") return isLow;
      if (filterStatus === "OUT") return isOut;
      return true;
    });
  }, [items, filterStatus]);

  const handleOpenAdjustment = (item: InventoryItem) => {
    setEditingItem(item);
    setNewQuantity(item.available_quantity);
    setMovementType("ADJUSTMENT");
    setNote("");
    setError(null);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !token) return;

    const delta = newQuantity - editingItem.available_quantity;
    if (delta === 0) {
      setIsAdjustModalOpen(false);
      return;
    }

    const absDelta = Math.abs(delta);

    // Auto-correct movement type direction based on the delta
    let finalMovementType = movementType;
    if (delta > 0 && finalMovementType === "OUT") finalMovementType = "IN";
    if (delta < 0) finalMovementType = "OUT"; // Force OUT for decreases to prevent logical collisions

    setIsSaving(true);
    setError(null);
    try {
      await adjustInventory(editingItem.id, absDelta, finalMovementType, note || undefined, token);
      setSuccess(`Synched: ${editingItem.sku}`);
      load();
      setIsAdjustModalOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Sync failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const lowStockCount = items.filter(i => i.available_quantity > 0 && i.available_quantity <= i.low_stock_threshold).length;

  return (
    <div className="min-h-screen bg-slate-50/20 selection:bg-slate-900 selection:text-white">
      {/* Search Focus Overlay - Dramatic Blur */}
      {isSearchFocused && (
        <div
          className="fixed inset-0 z-[60] bg-white/20 backdrop-blur-3xl animate-in fade-in duration-700 cursor-zoom-out"
          onClick={() => setIsSearchFocused(false)}
        />
      )}

      {/* Boutique Header */}
      <div className={`max-w-[1400px] mx-auto px-6 pt-12 pb-6 transition-all duration-700 ${isSearchFocused ? "opacity-20 blur-xl scale-95" : ""}`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Inventory Center</span>
            </div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tighter">Logistics <span className="font-bold">Studio</span></h1>
            <div className="flex items-center gap-4">
              <div className="px-2.5 py-0.5 bg-white border border-slate-100 rounded-full flex items-center gap-1.5 shadow-sm">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{totalItems} Assets</span>
              </div>
              <div className="px-2.5 py-0.5 bg-rose-50/50 border border-rose-100 rounded-full flex items-center gap-1.5">
                <Activity className="w-2.5 h-2.5 text-rose-400" />
                <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">{globalCriticalCount} Critical</span>
              </div>
            </div>
          </div>
          <button onClick={load} className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-950 transition-colors flex items-center gap-2 group">
            <RefreshCcw className={`w-3 h-3 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"}`} />
            Synchronize hub
          </button>
        </div>
      </div>

      {/* Immersive Control Row */}
      <div className={`sticky top-6 z-[70] max-w-[1400px] mx-auto px-6 transition-all duration-1000 ${isSearchFocused ? "translate-y-4" : ""}`}>
        <div className={`bg-white/70 backdrop-blur-3xl border border-slate-200 rounded-[1.6rem] p-1.5 transition-all duration-500 flex items-center justify-between gap-2 shadow-sm`}>

          <div className="flex items-center gap-4 pl-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Global Ledger</span>
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">Live Sync Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
                  ${activeSearch ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100"}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeSearch ? "Refine Search" : "Filter Studio"}
              {activeSearch && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            {/* STATUS FILTERS */}
            <div className={`flex items-center gap-0.5 bg-slate-50/50 p-1 rounded-xl transition-all duration-500`}>
              {(["LOW", "OUT"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? "ALL" : s)}
                  className={`px-6 py-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                          ${filterStatus === s ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {s === "LOW" ? "Low Stock" : "Zero Stock"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className={`max-w-[1400px] mx-auto px-6 mt-10 pb-40 transition-all duration-700 ${isSearchFocused ? "opacity-20 blur-2xl scale-95 pointer-events-none" : isLoading ? "opacity-40 blur-sm" : "opacity-100"}`}>
        {/* Boutique List Container */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/20 border-b border-slate-100">
                <th className="px-6 py-5 text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em] w-12 text-center">#</th>
                <th className="px-10 py-5 text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em]">Logistic Unit</th>
                <th className="px-10 py-5 text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em]">SKU</th>
                <th className="px-10 py-5 text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em]">Status</th>
                <th className="px-10 py-5 text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em] text-right">System</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-10 py-8"><div className="h-0.5 bg-slate-50 rounded-full w-full" /></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-40 text-center text-[10px] font-medium text-slate-200 uppercase tracking-[0.4em]">Grid Synchronized // Empty Result</td>
                </tr>
              ) : filteredItems.map((item, index) => {
                const isLow = item.available_quantity > 0 && item.available_quantity <= item.low_stock_threshold;
                const isOut = item.available_quantity === 0;
                const serialNumber = ((page - 1) * PAGE_SIZE) + index + 1;

                return (
                  <tr key={item.id} className="group hover:bg-slate-50/30 transition-all duration-500">
                    <td className="px-6 py-6 text-center">
                      <span className="text-[10px] font-black text-slate-200 group-hover:text-slate-900 transition-colors uppercase tracking-widest">{serialNumber.toString().padStart(2, '0')}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-[1.2rem] bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                          {item.product_image ? (
                            <img src={item.product_image} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                          ) : (
                            <Package className="w-6 h-6 text-slate-200" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="text-[14px] font-bold text-slate-900 tracking-tight leading-none uppercase">{item.product_name}</h4>

                          </div>
                          <p className="text-[9px] text-slate-400 font-medium tracking-widest mt-1.5 italic uppercase">{item.variant_info || "Standard Unit"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap">
                      <code className="text-[9px] font-bold text-slate-400 tracking-widest">{item.sku || "N/A"}</code>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl border transition-all duration-700
                              ${isOut ? "bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-100 scale-105" :
                            isLow ? "bg-amber-100 border-amber-200 text-amber-600" :
                              "bg-white border-slate-100 text-slate-950"}`}>
                          <span className="text-base font-black leading-none">{item.available_quantity}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[9px] font-bold uppercase tracking-widest leading-none
                                ${isOut ? "text-rose-500" : isLow ? "text-amber-500" : "text-emerald-500"}`}>
                            {isOut ? "Void" : isLow ? "Critical" : "Stable"}
                          </span>
                          <div className="w-10 h-[2px] bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div className={`h-full transition-all duration-1000 ${isOut ? "w-0" : isLow ? "w-1/3 bg-amber-400" : "w-full bg-emerald-400"}`} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button onClick={() => handleOpenAdjustment(item)} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-slate-950 transition-colors py-2 pl-6 border-l border-slate-100">
                        <Settings2 className="w-3 h-3" /> Reconcile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Logistic Pagination Footer - Boutique Grade */}
        {totalPages > 1 && (
          <div className="mt-20 flex flex-col items-center gap-10">
            <div className="w-12 h-[1px] bg-slate-200" />

            <div className="flex items-center gap-12">
              <button
                disabled={page === 1}
                onClick={() => { setPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="group flex items-center gap-3 disabled:opacity-20 transition-all duration-500"
              >
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all shadow-sm">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover:text-slate-950 transition-colors">Previous</span>
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[14px] font-light text-slate-900 tracking-tighter">
                  Page <span className="font-bold">{page.toString().padStart(2, '0')}</span> <span className="text-slate-200 mx-2 text-xs">/</span> {totalPages.toString().padStart(2, '0')}
                </span>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-1.5">Segmented Hub View</p>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => { setPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="group flex items-center gap-3 disabled:opacity-20 transition-all duration-500"
              >
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover:text-slate-950 transition-colors">Next Phase</span>
                <div className="w-10 h-10 rounded-full border border-slate-100 bg-white flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all shadow-sm group-active:scale-90">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            <div className="text-[9px] font-medium text-slate-200 italic">
              Currently indexing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, totalItems)} of {totalItems} total administrative assets
            </div>
          </div>
        )}
      </div>

      {/* Boutique Adjustment Modal */}
      {isAdjustModalOpen && editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-3xl animate-in fade-in duration-700">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100">
            <div className="p-12 pb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-light text-slate-950 tracking-tighter">Stock <span className="font-bold tracking-tight">Revision</span></h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingItem.sku}</p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-200 hover:text-slate-950 transition-colors"><X className="w-7 h-7 font-light" /></button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-12 pt-6 space-y-10 font-bold">
              <div className="flex items-center justify-between p-8 bg-slate-950 rounded-[2rem] relative overflow-hidden">
                <div className="relative z-10 space-y-1">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest">Base</p>
                  <p className="text-3xl text-white">{editingItem.available_quantity}</p>
                </div>
                <ChevronRight className="text-slate-700 w-10 h-10" />
                <div className="relative z-10 space-y-1 text-right">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest">Target</p>
                  <p className={`text-3xl ${newQuantity > editingItem.available_quantity ? "text-emerald-400" : "text-rose-400"}`}>
                    {newQuantity > editingItem.available_quantity ? "+" : ""}{newQuantity - editingItem.available_quantity}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-center">
                <label className="text-[9px] text-slate-300 uppercase tracking-[0.4em]">Allocate Units</label>
                <input
                  type="number"
                  min={0}
                  value={newQuantity}
                  onChange={e => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] py-12 text-7xl font-bold text-slate-950 text-center focus:outline-none focus:border-slate-950 transition-all shadow-inner tracking-tighter"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select value={movementType} onChange={e => setMovementType(e.target.value as MovementType)} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-[10px] text-slate-950 appearance-none focus:outline-none">
                  {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Audit note..." className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-[10px] text-slate-950 focus:outline-none placeholder:text-slate-200" />
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-6 rounded-[1.8rem] bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95 disabled:opacity-50">
                {isSaving ? "Syncing Logic..." : "Commit Log Entry"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Boutique Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-3xl animate-in fade-in duration-700">
          <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100">
            <div className="p-12 pb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-light text-slate-950 tracking-tighter">Filter <span className="font-bold tracking-tight">Studio</span></h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Reference Technical Assets</p>
              </div>
              <button onClick={() => setIsFilterModalOpen(false)} className="text-slate-200 hover:text-slate-950 transition-colors"><X className="w-8 h-8 font-light" /></button>
            </div>

            <div className="p-12 pt-10 space-y-12">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Search Query</label>
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 transition-colors group-focus-within:text-slate-950" />
                  <input
                    autoFocus
                    value={tempSearch}
                    onChange={e => setTempSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                    placeholder="Search by Product Name, Technical SKU, or Color..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] pl-16 pr-8 py-6 text-sm font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-slate-950 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleResetFilters}
                  className="flex items-center justify-center gap-3 py-6 rounded-[1.8rem] bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <Eraser className="w-4 h-4" /> Reset Layout
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex items-center justify-center gap-3 py-6 rounded-[1.8rem] bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 group"
                >
                  <Check className="w-4 h-4 group-hover:scale-125 transition-transform" /> Apply Filters
                </button>
              </div>
            </div>

            <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-[8px] font-medium text-slate-300 uppercase tracking-[0.3em]">Operational Infrastructure // Filter v4.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
