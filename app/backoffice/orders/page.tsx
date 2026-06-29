"use client";

import { useState, useEffect, useMemo, useRef, SetStateAction } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchBackofficeOrders } from "@/lib/api/orders";
import { fetchDashboardStats, DashboardStats } from "@/lib/api/analytics";
import { Order, OrderStatus } from "@/types/order";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Eye,
    Calendar,
    User,
    CreditCard,
    FileDown,
    RefreshCw,
    Plus,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    SearchX,
    MoreVertical,
    Printer,
    Download,
    Copy,
    Ban,
    CheckCircle,
    Play,
    Box,
    Truck,
    LayoutGrid,
    SlidersHorizontal,
    RotateCcw,
    ChevronDown,
    ExternalLink,
    Clock,
    Zap
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { OrderDrawer } from "@/components/backoffice/orders/OrderDrawer";
import { useRouter } from "next/navigation";

const getStatusProgress = (status: OrderStatus) => {
    switch (status) {
        case "PENDING": return 20;
        case "CONFIRMED": return 40;
        case "PROCESSING": return 60;
        case "SHIPPED": return 80;
        case "DELIVERED": return 100;
        case "CANCELLED": return 0;
        case "READY_TO_DISPATCH": return 70;
        case "DISPATCHED": return 75;
        default: return 20;
    }
};

export default function OrderListPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("PENDING");
    const [paymentFilter, setPaymentFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Selected order for drawer
    const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);

    const loadOrders = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [ordersData, statsData] = await Promise.all([
                fetchBackofficeOrders({
                    token,
                    search: search || undefined,
                    status: search ? undefined : (statusFilter || undefined),
                    page
                }),
                fetchDashboardStats(token)
            ]);
            setOrders(ordersData.results);
            setTotalCount(ordersData.count);
            setStats(statsData);
        } catch (err) {
            console.error("Failed to load orders", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(loadOrders, 400);
        return () => clearTimeout(timer);
    }, [search, statusFilter, page, token]);

    const handleCreateOrder = () => {
        alert("Initializing Manual Order Pipeline...");
    };

    const handleExport = () => {
        alert(`Exporting ${totalCount} records...`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans selection:bg-slate-100 antialiased overflow-hidden">

            {/* 1. Integrated Operations Header */}
            <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-bold tracking-tight text-slate-900">Orders Management</h1>
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[8px] font-bold uppercase tracking-widest border border-amber-100">Live Operation</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">Terminal access to customer transaction lifecycle.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadOrders}
                        className="h-8 px-3 flex items-center gap-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Refresh</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="h-8 px-3 flex items-center gap-2 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <FileDown className="w-3.5 h-3.5" />
                        Export
                    </button>
                    <button
                        onClick={handleCreateOrder}
                        className="h-8 px-4 flex items-center gap-2 rounded-md bg-slate-900 border border-slate-900 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Order
                    </button>
                </div>
            </header>

            {/* 2. Tooling Summary Strip - Removed per request */}

            {/* 3. Operational Filter Bar */}
            <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Reference, customer, or tracking ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 bg-slate-50 border-slate-200 border rounded-lg pl-10 pr-4 text-[11px] font-medium focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                        />
                    </div>

                    <FilterDropdown
                        label="Order Status"
                        value={statusFilter}
                        options={[
                            { label: "Pending Verification", value: "PENDING" },
                            { label: "Confirmed", value: "CONFIRMED" },
                            { label: "Processing", value: "PROCESSING" },
                            { label: "Shipped", value: "SHIPPED" },
                            { label: "Delivered", value: "DELIVERED" },
                            { label: "Cancelled", value: "CANCELLED" },
                        ]}
                        onSelect={(v: SetStateAction<string>) => { setStatusFilter(v); setPage(1); }}
                        isOpen={openDropdown === "status"}
                        toggle={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
                    />

                    <FilterDropdown
                        label="Payment Type"
                        value={paymentFilter}
                        options={[
                            { label: "Paid Settlements", value: "PAID" },
                            { label: "Pending Funds", value: "PENDING" },
                            { label: "Failed Transactions", value: "FAILED" },
                        ]}
                        onSelect={(v: SetStateAction<string>) => { setPaymentFilter(v); setPage(1); }}
                        isOpen={openDropdown === "payment"}
                        toggle={() => setOpenDropdown(openDropdown === "payment" ? null : "payment")}
                    />

                    {(search || statusFilter !== "PENDING" || paymentFilter) && (
                        <button
                            onClick={() => { setSearch(""); setStatusFilter("PENDING"); setPaymentFilter(""); setPage(1); }}
                            className="h-9 px-3 flex items-center gap-2 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest border border-rose-100 rounded-lg bg-rose-50/50"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Clear Workspace
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button className="h-9 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 flex items-center gap-2 border border-slate-100 rounded-lg transition-colors">
                        Sort By
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* 4. Table Context Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col bg-white">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verifying Operational Cache...</p>
                    </div>
                )}

                <div className="flex-1 overflow-auto no-scrollbar pb-24 relative">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
                        <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100 shadow-sm">
                            <tr>
                                <th className="w-14 px-4 py-4">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-0" />
                                </th>
                                <th className="w-56 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Transaction ID</th>
                                <th className="w-64 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer Identity</th>
                                <th className="w-20 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Items</th>
                                <th className="w-48 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Verification</th>
                                <th className="w-40 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Lifecycle</th>
                                <th className="w-40 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</th>
                                <th className="w-36 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Settlement</th>
                                <th className="w-40 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Time Ago</th>
                                <th className="w-16 px-4 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {orders.length === 0 && !isLoading ? (
                                <tr>
                                    <td colSpan={10} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <SearchX className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">No Operational Records</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current filter parameters resulted in zero active entries.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className={cn(
                                            "group hover:bg-slate-50/80 transition-colors cursor-pointer border-l-2 border-transparent",
                                            drawerOrderId === order.id && "bg-slate-50 border-l-slate-900",
                                            activeMenuId === order.id && "bg-slate-50/50"
                                        )}
                                        onClick={() => setDrawerOrderId(order.id)}
                                    >
                                        <td className="px-4 py-4" onClick={(e) => { e.stopPropagation(); }}>
                                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    (order as any).lifecycle === "PENDING" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" :
                                                        (order as any).lifecycle === "DELIVERED" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" :
                                                            "bg-slate-200"
                                                )} />
                                                <span className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tabular-nums">
                                                    {(order as any).transaction_id || order.order_number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 uppercase ring-1 ring-slate-200 group-hover:bg-white transition-all shadow-sm">
                                                    {((order as any).customer_identity || order.customer_name || "?").charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-700 tracking-tight uppercase">{(order as any).customer_identity || order.customer_name || "Guest User"}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mt-0.5">{order.customer_phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded border border-slate-100 text-[10px] font-black text-slate-500">
                                                {(order as any).items || order.item_count}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                (order as any).verification === "VERIFIED" || (order as any).verification === "PAID" || order.payment_status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    (order as any).verification === "FAILED" || (order as any).verification === "REJECTED" || order.payment_status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                        "bg-amber-50 text-amber-700 border-amber-100"
                                            )}>
                                                {(order as any).verification || order.payment_status || "PENDING"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <OrderStatusBadge status={(order as any).lifecycle || order.status} className="scale-90 origin-left" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-700",
                                                            getStatusProgress(order.status) >= 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-blue-500"
                                                        )}
                                                        style={{ width: `${getStatusProgress(order.status)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                    {getStatusProgress(order.status)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-black text-[11px] text-slate-900 tabular-nums">
                                            Rs {(order as any).settlement || order.total_price}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-900 transition-colors">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                    {formatDistanceToNow(new Date((order as any).created_at || order.created_at), { addSuffix: false })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setActiveMenuId(activeMenuId === order.id ? null : order.id)}
                                                className={cn(
                                                    "h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900",
                                                    activeMenuId === order.id && "bg-white shadow-sm border-slate-200 text-slate-900"
                                                )}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {activeMenuId === order.id && (
                                                <div
                                                    className={cn(
                                                        "absolute right-10 top-0 w-36 bg-white border border-slate-200 rounded-lg shadow-2xl z-[100] py-1 animate-in slide-in-from-right-1 fade-in duration-150 origin-right overflow-hidden",
                                                    )}
                                                >
                                                    <MenuAction icon={<Eye className="w-3.5 h-3.5 text-blue-500" />} label="Quick View" onClick={() => { setDrawerOrderId(order.id); setActiveMenuId(null); }} />
                                                    <MenuAction icon={<Printer className="w-3.5 h-3.5" />} label="Invoice" onClick={() => { alert("Printing..."); setActiveMenuId(null); }} />
                                                    <div className="h-px bg-slate-50 my-0.5" />
                                                    <MenuAction icon={<ExternalLink className="w-3.5 h-3.5" />} label="Track" onClick={() => { alert("Opening tracking..."); setActiveMenuId(null); }} />
                                                    <MenuAction icon={<Copy className="w-3.5 h-3.5" />} label="Copy ID" onClick={() => { navigator.clipboard.writeText(order.order_number); setActiveMenuId(null); }} />
                                                    <div className="h-px bg-slate-50 my-1" />
                                                    <MenuAction icon={<Ban className="w-3.5 h-3.5" />} label="Abort Order" color="text-rose-500" onClick={() => { alert("Aborting..."); setActiveMenuId(null); }} />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 5. Tooling Pagination */}
                <div className="shrink-0 px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between z-40">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                            <span className="text-slate-400">Ledger Page</span>
                            <span>{page} / {Math.ceil(totalCount / 10) || 1}</span>
                        </div>
                        <div className="h-3 w-px bg-slate-200" />
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Active Stream: <span className="text-slate-900">{orders.length} Records</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <PaginationButton
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            icon={<ChevronLeft className="w-3.5 h-3.5" />}
                        />
                        <PaginationButton
                            disabled={orders.length < 10}
                            onClick={() => setPage(p => p + 1)}
                            icon={<ChevronRight className="w-3.5 h-3.5" />}
                        />
                    </div>
                </div>
            </main>

            {/* 6. Intelligence Drawer Integration */}
            {token && (
                <OrderDrawer
                    orderId={drawerOrderId}
                    token={token}
                    onClose={() => setDrawerOrderId(null)}
                    onUpdate={loadOrders}
                />
            )}

            {/* Interaction Overlays */}
            {openDropdown && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpenDropdown(null)} />}
            {activeMenuId && <div className="fixed inset-0 z-[60] bg-transparent" onClick={() => setActiveMenuId(null)} />}

        </div>
    );
}

// ── INTERNAL TOOLING COMPONENTS ──────────────────────────────────────────

function StatusMetric({ label, value, icon, color = "text-slate-900" }: any) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-50 rounded text-slate-300">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
                <span className={cn("text-xs font-bold tracking-tight mt-0.5", color)}>{value}</span>
            </div>
        </div>
    );
}

function FilterDropdown({ label, value, options, onSelect, isOpen, toggle }: any) {
    const selected = options.find((o: any) => o.value === value);
    return (
        <div className="relative">
            <button
                onClick={toggle}
                className={cn(
                    "h-9 px-4 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all",
                    value && value !== "PENDING" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 shadow-sm"
                )}
            >
                {selected ? selected.label : label}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] py-2 animate-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top max-h-[300px] overflow-y-auto overflow-x-hidden no-scrollbar">
                    {options.map((opt: any) => (
                        <button
                            key={opt.value}
                            onClick={() => { onSelect(opt.value); toggle(); }}
                            className="w-full text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function MenuAction({ icon, label, onClick, color = "text-slate-600" }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors border-l-2 border-transparent hover:border-slate-900",
                color
            )}
        >
            {icon}
            <span className="truncate">{label}</span>
        </button>
    );
}

function PaginationButton({ disabled, onClick, icon }: any) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="h-8 px-3 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
        >
            {icon}
        </button>
    );
}

function AlertCircleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    );
}
