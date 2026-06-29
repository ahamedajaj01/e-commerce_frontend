"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyOrders } from "@/lib/api/orders";
import { Order, OrderStatus } from "@/types/order";
import { getMediaUrl } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Package, ShoppingBag, ChevronLeft, ChevronRight,
    MapPin, Truck, Clock, CheckCircle2, XCircle,
    Eye, Navigation, Loader2, RefreshCcw
} from "lucide-react";

// ── Status config ─────────────────────────────────────────────────────────────

const statusConfig: Record<OrderStatus, { label: string; color: string; dot: string; icon: any }> = {
    PENDING: { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-200", dot: "bg-amber-400", icon: Clock },
    CONFIRMED: { label: "Confirmed", color: "text-blue-600 bg-blue-50 border-blue-200", dot: "bg-blue-500", icon: CheckCircle2 },
    PROCESSING: { label: "Processing", color: "text-indigo-600 bg-indigo-50 border-indigo-200", dot: "bg-indigo-500", icon: Package },
    READY_TO_DISPATCH: { label: "Ready to Ship", color: "text-cyan-600 bg-cyan-50 border-cyan-200", dot: "bg-cyan-500", icon: Package },
    DISPATCHED: { label: "Dispatched", color: "text-sky-600 bg-sky-50 border-sky-200", dot: "bg-sky-500", icon: Truck },
    SHIPPED: { label: "Shipped", color: "text-purple-600 bg-purple-50 border-purple-200", dot: "bg-purple-500", icon: Truck },
    DELIVERED: { label: "Delivered", color: "text-emerald-600 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelled", color: "text-slate-500 bg-slate-100 border-slate-200", dot: "bg-slate-400", icon: XCircle },
};

const FILTERS: { label: string; value: string }[] = [
    { label: "All Orders", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
];

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "READY_TO_DISPATCH", "DISPATCHED", "SHIPPED"];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
    const { token, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || !token) { setIsLoading(false); return; }
        setIsLoading(true);
        fetchMyOrders(token)
            .then(data => setOrders(Array.isArray(data) ? data : data.results || []))
            .catch(err => setError(err.message || "Failed to load orders."))
            .finally(() => setIsLoading(false));
    }, [token, isAuthenticated, authLoading]);

    if (!isAuthenticated && !authLoading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6">
                <div className="max-w-sm w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-7 h-7 text-slate-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Sign in to view your orders</h2>
                        <p className="text-sm text-slate-500 mt-1">Track your purchases and manage your orders.</p>
                    </div>
                    <Link href="/auth/login" className="block w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const filteredOrders = orders.filter(o => {
        if (filter === "ALL") return true;
        if (filter === "ACTIVE") return ACTIVE_STATUSES.includes(o.status);
        return o.status === filter;
    });

    return (
        <div className="min-h-screen bg-[#f7f7f8]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => router.push("/profile")} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-slate-900">My Orders</h1>
                        <p className="text-xs text-slate-400">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
                    </div>
                    {!isLoading && (
                        <button
                            onClick={() => { setIsLoading(true); fetchMyOrders(token!).then(d => setOrders(Array.isArray(d) ? d : d.results || [])).finally(() => setIsLoading(false)); }}
                            className="ml-auto p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-3 overflow-x-auto no-scrollbar">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f.value
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-4">
                            <div className="flex gap-3">
                                <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center">
                        <p className="text-sm font-semibold text-rose-600">{error}</p>
                        <button onClick={() => window.location.reload()} className="mt-3 text-xs font-bold text-rose-500 underline">Retry</button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <Package className="w-7 h-7 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">No orders found</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                {filter === "ALL" ? "You haven't placed any orders yet." : `No ${filter.toLowerCase()} orders.`}
                            </p>
                        </div>
                        {filter !== "ALL" ? (
                            <button onClick={() => setFilter("ALL")} className="text-sm font-bold text-slate-600 underline">Show all orders</button>
                        ) : (
                            <Link href="/" className="inline-block px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl">
                                Start Shopping
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredOrders.map(order => <OrderRow key={order.id} order={order} />)
                )}
            </div>
        </div>
    );
}

// ── Order Row Card ────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: Order }) {
    const router = useRouter();
    const cfg = statusConfig[order.status] ?? statusConfig.PENDING;
    const StatusIcon = cfg.icon;
    const isActive = ACTIVE_STATUSES.includes(order.status);
    const isDelivered = order.status === "DELIVERED";
    const isCancelled = order.status === "CANCELLED";

    // Show first 2 item thumbnails, then overflow count
    const visibleItems = order.items?.slice(0, 3) || [];
    const extraCount = (order.items?.length || 0) - visibleItems.length;

    return (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden transition-all hover:border-slate-300">

            {/* Order header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/40">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-500">#{order.order_number}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-[11px] text-slate-400">{format(new Date(order.created_at), "d MMM yyyy")}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide ${cfg.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                </div>
            </div>

            {/* Items list */}
            <div className="px-4 py-4 space-y-4">
                {visibleItems.length > 0 ? (
                    visibleItems.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center gap-4">
                            {/* Thumbnail */}
                            <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                {/* Check item.image, item.variant_image, item.thumbnail */}
                                {(item.image || item.variant_image || item.thumbnail) ? (
                                    <img
                                        src={getMediaUrl(item.image || item.variant_image || item.thumbnail)}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                )}
                            </div>

                            {/* Item details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.product_name}</p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.variant_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-slate-900">Rs {item.unit_price}</span>
                                    <span className="text-xs text-slate-400">× {item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : order.image ? (
                    /* Fallback for list view when items are not expanded but image is provided */
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                            <img
                                src={getMediaUrl(order.image)}
                                alt="Order Product"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                                {order.item_count} Product{order.item_count !== 1 ? 's' : ''}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                Recipient: {order.customer_identity || 'Standard Delivery'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 py-2">
                        <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-6 h-6 text-slate-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-400 italic">No item details available</p>
                        </div>
                    </div>
                )}

                {extraCount > 0 && (
                    <p className="text-[11px] text-slate-400 font-medium pl-18">
                        +{extraCount} more product{extraCount > 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* Footer: total + delivery info + actions */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-[11px] text-slate-500">Order Total:</p>
                        <p className="text-sm font-bold text-slate-900">Rs {order.total_price}</p>
                    </div>
                    {isActive && order.arrival_estimate && (
                        <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] text-slate-500">Delivery Est: {order.arrival_estimate}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Track button */}
                    {(isActive || isDelivered) && (
                        <Link
                            href={`/track-order?number=${order.order_number}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            Track
                        </Link>
                    )}

                    {/* View Details */}
                    <Link
                        href={`/account/orders/${order.id}`}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 text-white text-[11px] font-bold hover:bg-slate-800 transition-all"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                    </Link>
                </div>
            </div>

            {/* Status Info Strip — Passive, no spinner */}
            {isActive && (
                <div className="px-4 py-2 bg-blue-50/50 border-t border-blue-100/50 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <p className="text-[10px] font-medium text-blue-600">
                        Our fulfillment team is preparing your package for dispatch.
                    </p>
                </div>
            )}
        </div>
    );
}
