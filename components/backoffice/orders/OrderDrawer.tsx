"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types/order";
import { fetchBackofficeOrderDetails, updateOrderStatus } from "@/lib/api/orders";
import { fetchBackofficeTransactions } from "@/lib/api/payments";
import { Transaction } from "@/types/payment";
import {
    X,
    Package,
    Truck,
    MapPin,
    Calendar,
    User,
    CreditCard,
    ChevronRight,
    Loader2,
    Clock,
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    Receipt,
    History,
    MoreHorizontal,
    Printer,
    Download,
    Ban,
    PauseCircle,
    PlayCircle,
    ArrowRight,
    Box,
    MessageSquare,
    DollarSign,
    Tag,
    Layers,
    Palette,
    Maximize2,
    ExternalLink,
    Mail,
    Phone,
    Copy,
    Info,
    ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { cn, getMediaUrl } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";

interface OrderDrawerProps {
    orderId: string | null;
    token: string;
    onClose: () => void;
    onUpdate: () => void;
}

export function OrderDrawer({ orderId, token, onClose, onUpdate }: OrderDrawerProps) {
    const [order, setOrder] = useState<Order | any>(null);
    const [transaction, setTransaction] = useState<Transaction | any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Workbench State
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (orderId) {
            loadOrder();
        } else {
            setOrder(null);
            setTransaction(null);
        }
    }, [orderId]);

    const loadOrder = async () => {
        setIsLoading(true);
        try {
            const data = await fetchBackofficeOrderDetails(orderId!, token);
            setOrder(data);

            // --- Triple-fallback transaction resolution ---
            let tx = null;

            // Strategy 1: filter by order_id (most precise)
            try {
                const r1 = await fetchBackofficeTransactions({ token, order_id: data.id });
                if (r1.results.length > 0) tx = r1.results[0];
            } catch (_) { }

            // Strategy 2: text search by order_number
            if (!tx) {
                try {
                    const r2 = await fetchBackofficeTransactions({ token, search: data.order_number });
                    if (r2.results.length > 0) tx = r2.results[0];
                } catch (_) { }
            }

            // Strategy 3: fetch all, find by order_id match
            if (!tx) {
                try {
                    const r3 = await fetchBackofficeTransactions({ token });
                    tx = r3.results.find((t: any) => t.order_id === data.id || t.order_number === data.order_number) ?? null;
                } catch (_) { }
            }

            if (tx) {
                // Normalize: expose whichever image field the backend uses
                const raw: any = tx;
                if (!raw.proof_image && raw.image) raw.proof_image = raw.image;
                setTransaction(raw);
            }
        } catch (err) {
            console.error("[Drawer] Load Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (status: OrderStatus) => {
        if (!order) return;

        const effectiveNotes = notes.trim() || (status === "CANCELLED" ? "Order cancelled by administrator." : "");

        const confirmMsg = `Review Action: Confirm status change to [${status}] for ${order.order_number}?`;
        if (!window.confirm(confirmMsg)) return;

        setIsUpdating(true);
        try {
            await updateOrderStatus(order.id, { status, notes: effectiveNotes }, token);
            await loadOrder();
            onUpdate();
            setNotes("");
            alert(`Record updated to ${status}.`);
        } catch (err: any) {
            alert(err.message || "Fulfillment update failed.");
        } finally {
            setIsUpdating(false);
        }
    };

    const getPrimaryAction = () => {
        if (!order) return null;
        switch (order.status) {
            case "PENDING":
                return { label: "Approve & Confirm", status: "CONFIRMED" as OrderStatus, icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> };
            case "CONFIRMED":
                return { label: "Start Processing", status: "PROCESSING" as OrderStatus, icon: <PlayCircle className="w-4 h-4 text-blue-400" /> };
            case "PROCESSING":
                return { label: "Ship Order", status: "SHIPPED" as OrderStatus, icon: <Truck className="w-4 h-4 text-sky-400" /> };
            case "SHIPPED":
                return { label: "Mark as Delivered", status: "DELIVERED" as OrderStatus, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> };
            case "READY_TO_DISPATCH":
            case "DISPATCHED":
                return { label: "Ship Order", status: "SHIPPED" as OrderStatus, icon: <Truck className="w-4 h-4 text-sky-400" /> };
            default:
                return null;
        }
    };

    const primaryAction = getPrimaryAction();
    const canCancel = !["DELIVERED", "CANCELLED"].includes(order?.status);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied: " + text);
    };

    if (!orderId) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500",
                    orderId ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Side Panel - Enterprise Workspace Width */}
            <div className={cn(
                "relative w-full max-w-[700px] bg-white h-full shadow-[0_0_80px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] border-l border-slate-200 overflow-hidden",
                orderId ? "translate-x-0" : "translate-x-full"
            )}>

                {/* 1. COMPACT TOP HEADER */}
                <div className="shrink-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="space-y-0.5">
                            <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-tight tabular-nums">
                                {order ? order.order_number : "Loading..."}
                            </h2>
                            {order && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(order.created_at), "MMM d, HH:mm")}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                    <OrderStatusBadge status={order.status} className="scale-75 origin-left" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="h-8 px-3 rounded-lg border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                            <Printer className="w-3.5 h-3.5" />
                            Invoice
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar relative bg-white pb-32">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Record...</p>
                        </div>
                    ) : order ? (
                        <div className="divide-y divide-slate-100">

                            {/* SECTION 1: CUSTOMER IDENTITY (Vertical Section) */}
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        Customer Identity
                                    </h4>
                                    {order.customer_email ? (
                                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Registered Account</span>
                                    ) : (
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">Guest Checkout</span>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black italic shadow-xl shrink-0">
                                            {order.customer_name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-black text-slate-900 leading-none">{order.customer_name}</p>
                                            <p className="text-sm font-medium text-slate-500 leading-none">{order.customer_email || "No email linked"}</p>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pt-1">{order.customer_phone}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <SidebarData label="Fulfillment Type" value="Delivery" />
                                        <SidebarData label="Client Tier" value="Active User" />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: THE MANIFEST (Ordered Products) */}
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ClipboardList className="w-3.5 h-3.5" />
                                        Ordered Manifest
                                    </h4>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{order.item_count} Items</span>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    {order.items.map((item: any) => (
                                        <div key={item.id} className="p-5 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                            <div className="flex gap-4">
                                                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-sm relative group/img cursor-zoom-in">
                                                    {(() => {
                                                        const itemImg = item.thumbnail || item.image || item.product_image;
                                                        return itemImg ? (
                                                            <>
                                                                <img
                                                                    src={getMediaUrl(itemImg)}
                                                                    className="max-w-full max-h-full object-contain group-hover/img:scale-110 transition-transform duration-500"
                                                                    alt={item.product_name}
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                                                    }}
                                                                />
                                                                <div
                                                                    onClick={() => window.open(getMediaUrl(itemImg), "_blank")}
                                                                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                                                                >
                                                                    <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow-md" />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <Package className="w-6 h-6 text-slate-200" />
                                                        );
                                                    })()}
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none">{item.product_name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-900 text-white rounded uppercase tracking-widest leading-none">SKU: {item.sku}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Size: {item.variant_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="text-[12px] font-black text-slate-900">Rs {item.line_total}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-6 bg-slate-50/50 space-y-3">
                                        <PriceDetail label="Subtotal" value={`Rs ${order.subtotal}`} />
                                        <PriceDetail label="Shipping Fee" value={`+ Rs ${order.shipping_fee}`} />
                                        <div className="h-px bg-slate-200 my-1" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Total Balance</span>
                                            <span className="text-xl font-black text-slate-900">Rs {order.total_price}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: FINANCIAL AUDIT (Vertical) */}
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <CreditCard className="w-3.5 h-3.5" />
                                        Payment Intelligence
                                    </h4>
                                    <PaymentStatusBadge status={order.payment_status} className="scale-75" />
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                        <StatItem label="Payment Method" value={order.payment_method_name} highlight />
                                        <StatItem label="Gateway Provider" value={transaction?.payment_method_name || "Nabil Bank"} />
                                        <StatItem label="Settle Status" value={transaction?.status || order.payment_status} />
                                        <StatItem label="Reference ID" value={transaction?.id.slice(0, 12) || "N/A"} mono />
                                        <StatItem label="Time Anchor" value={transaction?.updated_at ? format(new Date(transaction.updated_at), "MMM d, HH:mm") : "N/A"} />
                                    </div>

                                    {/* Audit Evidence (Proof) - Full Width Below */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Settlement Evidence (Voucher)</p>
                                        {(() => {
                                            const proofUrl = transaction?.proofs?.[0]?.image_url || transaction?.proofs?.[0]?.image || transaction?.proof_image || transaction?.image;
                                            return proofUrl ? (
                                                <div className="relative group bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden p-6 flex flex-col items-center justify-center min-h-[350px] shadow-inner">
                                                    <img
                                                        src={getMediaUrl(proofUrl)}
                                                        className="max-h-[300px] w-full object-contain rounded-lg shadow-2xl transition-transform group-hover:scale-[1.02] duration-500"
                                                        alt="Settlement Receipt"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            if (target.parentElement) {
                                                                const errorChild = document.createElement('div');
                                                                errorChild.className = 'text-center space-y-3 opacity-50';
                                                                errorChild.innerHTML = '<p class="text-[10px] font-black uppercase text-rose-500">Resource Unavailable</p>';
                                                                target.parentElement.appendChild(errorChild);
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                                        <button onClick={() => window.open(getMediaUrl(proofUrl), "_blank")} className="h-10 px-4 bg-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl hover:scale-105 transition-transform">
                                                            <Maximize2 className="w-4 h-4" />
                                                            Enlarge Voucher
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 border border-slate-100 border-dashed rounded-2xl p-12 text-center space-y-3">
                                                    <AlertCircle className="w-8 h-8 text-slate-200 mx-auto" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Settlement Receipt Linked</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: LOGISTICS (Vertical) */}
                            <div className="p-8 space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    Shipping Destination
                                </h4>
                                <div className="space-y-4">
                                    <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
                                        <Truck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                                        <div className="space-y-1 relative z-10">
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">Recipient Address</p>
                                            <p className="text-sm font-black italic leading-tight">{order.shipping_street}</p>
                                            <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">{order.shipping_city}, {order.shipping_district}</p>
                                            <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">{order.shipping_province}, Nepal</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Method</p>
                                            <p className="text-[11px] font-black text-slate-900 uppercase">Standard Delivery</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-right">
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Estimate</p>
                                            <p className="text-[11px] font-black text-slate-900 uppercase">{order.arrival_estimate || "3-5 Business Days"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 5: AUDIT LOG (Vertical) */}
                            <div className="p-8 space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <History className="w-3.5 h-3.5" />
                                    Transaction Audit Log
                                </h4>
                                <div className="space-y-8 relative border-l-2 border-slate-100 ml-2 pl-6">
                                    {order.status_history.slice().reverse().map((event: any, idx: number) => (
                                        <div key={idx} className="relative group">
                                            <div className="absolute -left-[32px] top-1 w-4 h-4 bg-white border-2 border-slate-200 rounded-full group-first:bg-slate-900 group-first:border-slate-900 z-10 transition-all group-hover:scale-125" />
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{event.status}</p>
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase">{format(new Date(event.created_at), "MMM d, HH:mm")}</p>
                                                </div>
                                                {event.notes && (
                                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-[11px] font-medium text-slate-500 leading-relaxed italic shadow-inner">
                                                        "{event.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ) : null}
                </div>

                {/* 9. FIXED ADMIN DECISION FOOTER */}
                <div className="shrink-0 bg-white border-t border-slate-100 p-6 z-30 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
                    <div className="space-y-6">
                        <div className="relative group">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter operational notes or reason for status change. This is visible to the customer."
                                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-[11px] font-medium placeholder:text-slate-300 outline-none focus:ring-1 focus:ring-slate-900 transition-all resize-none italic shadow-inner"
                            />
                            <div className="absolute top-0 right-5 -translate-y-1/2 bg-white px-2 text-[8px] font-black text-slate-300 uppercase tracking-widest border-x border-white">Resolution Memo</div>
                        </div>
                        <div className="grid grid-cols-12 gap-3">
                            {canCancel && (
                                <div className="col-span-4">
                                    <FooterAction
                                        label="Cancel Order"
                                        color="rose"
                                        icon={<Ban />}
                                        onClick={() => handleAction("CANCELLED")}
                                        disabled={isUpdating}
                                    />
                                </div>
                            )}
                            <div className={cn(canCancel ? "col-span-8" : "col-span-12")}>
                                {primaryAction ? (
                                    <button
                                        onClick={() => handleAction(primaryAction.status)}
                                        disabled={isUpdating}
                                        className="w-full h-11 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-30"
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            primaryAction.icon
                                        )}
                                        {primaryAction.label}
                                    </button>
                                ) : (
                                    <div className="h-11 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Lifecycle Terminal Stage Reached</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ── INTERNAL HELPER COMPONENTS ───────────────────────────────────────────

function SidebarData({ label, value }: any) {
    return (
        <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">{label}</p>
            <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{value}</p>
        </div>
    );
}

function StatItem({ label, value, mono, highlight }: any) {
    return (
        <div className="space-y-1.5">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">{label}</p>
            <p className={cn(
                "text-[11px] font-black uppercase tracking-tight",
                mono ? "font-mono text-slate-500" : "text-slate-900",
                highlight ? "text-emerald-600" : ""
            )}>{value}</p>
        </div>
    );
}

function PriceDetail({ label, value }: any) {
    return (
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-900">{value}</span>
        </div>
    );
}

function FooterAction({ label, color, icon, onClick, disabled }: any) {
    const colors: any = {
        amber: "border-amber-200 text-amber-600 hover:bg-amber-50 bg-white",
        rose: "border-rose-200 text-rose-600 hover:bg-rose-50 bg-white"
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-full h-11 border rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-sm",
                colors[color]
            )}
        >
            <span className="w-3.5 h-3.5">{icon}</span>
            {label}
        </button>
    );
}
