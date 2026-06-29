"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchBackofficeOrderDetails, updateOrderStatus } from "@/lib/api/orders";
import { fetchBackofficeTransactions } from "@/lib/api/payments";
import { Order, OrderStatus } from "@/types/order";
import { Transaction } from "@/types/payment";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import {
    Loader2,
    ChevronLeft,
    Printer,
    Download,
    Copy,
    Package,
    History,
    CreditCard,
    MapPin,
    User,
    CheckCircle2,
    XCircle,
    PauseCircle,
    Info,
    ExternalLink,
    Mail,
    Phone,
    Calendar,
    Clock,
    DollarSign,
    ShieldCheck,
    AlertCircle,
    Tag,
    Layers,
    Palette,
    Maximize2,
    MessageSquare,
    Box,
    Receipt
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getMediaUrl, cn } from "@/lib/utils";

export default function OrderReviewWorkspace() {
    const { uuid } = useParams();
    const router = useRouter();
    const { token } = useAuth();

    const [order, setOrder] = useState<Order | any>(null);
    const [transaction, setTransaction] = useState<Transaction | any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Workbench State
    const [notes, setNotes] = useState("");
    const [auditStatus, setAuditStatus] = useState<OrderStatus>("PENDING");

    const loadData = async () => {
        if (!token || !uuid) return;
        setIsLoading(true);
        try {
            const orderData = await fetchBackofficeOrderDetails(uuid as string, token);
            setOrder(orderData);
            setAuditStatus(orderData.status);

            // Triple-fallback transaction resolution
            let tx: any = null;

            // Strategy 1: filter by order_id
            try {
                const r1 = await fetchBackofficeTransactions({ token, order_id: orderData.id });
                if (r1.results.length > 0) tx = r1.results[0];
            } catch (_) { }

            // Strategy 2: text search by order_number
            if (!tx) {
                try {
                    const r2 = await fetchBackofficeTransactions({ token, search: orderData.order_number });
                    if (r2.results.length > 0) tx = r2.results[0];
                } catch (_) { }
            }

            // Strategy 3: fetch all, find match
            if (!tx) {
                try {
                    const r3 = await fetchBackofficeTransactions({ token });
                    tx = r3.results.find((t: any) => t.order_id === orderData.id || t.order_number === orderData.order_number) ?? null;
                } catch (_) { }
            }

            if (tx) {
                // Normalize: expose whichever image field the backend sends
                if (!tx.proof_image && tx.image) tx.proof_image = tx.image;
                setTransaction(tx);
            }
        } catch (err) {
            console.error("[Workspace] Data Load Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [uuid, token]);

    const handleAction = async (status: OrderStatus) => {
        if (!token || !uuid || !order) return;

        const effectiveNotes = notes.trim() || (status === "CANCELLED" ? "Order cancelled by administrator." : "");

        const confirmMsg = `Confirm operational change to [${status}]? This action will be logged in the permanent audit trail.`;
        if (!window.confirm(confirmMsg)) return;

        setIsUpdating(true);
        try {
            const updateQueue: Promise<any>[] = [updateOrderStatus(uuid as string, { status, notes: effectiveNotes }, token)];

            // If we are confirming the order, we should ALSO verify the transaction if it exists
            if (status === "CONFIRMED" && transaction) {
                const { verifyTransaction } = await import("@/lib/api/payments");
                updateQueue.push(verifyTransaction(transaction.id, { approve: true, notes: `Auto-verified upon Order Approval: ${effectiveNotes}` }, token));
            }

            // If we are cancelling the order, we should reject the transaction if it exists
            if (status === "CANCELLED" && transaction) {
                const { verifyTransaction } = await import("@/lib/api/payments");
                updateQueue.push(verifyTransaction(transaction.id, { approve: false, notes: `Auto-rejected upon Order Cancellation: ${effectiveNotes}` }, token));
            }

            await Promise.all(updateQueue);
            await loadData();
            setNotes("");
            alert(`Record updated to ${status} and payment state synchronized.`);
        } catch (err: any) {
            alert(err.message || "Fulfillment update failed.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleVerifyTransaction = async (verifyStatus: "APPROVED" | "REJECTED") => {
        if (!token || !transaction) return;

        const confirmMsg = `Permanently mark this transaction as ${verifyStatus}? This will settle the financial record.`;
        if (!window.confirm(confirmMsg)) return;

        setIsUpdating(true);
        try {
            const { verifyTransaction } = await import("@/lib/api/payments");
            await verifyTransaction(transaction.id, { approve: verifyStatus === "APPROVED", notes: `Finance Audit Decision: ${notes}` }, token);
            await loadData();
            setNotes("");
            alert(`Transaction marked as ${verifyStatus}. Operational ledger synchronized.`);
        } catch (err: any) {
            alert(err.message || "Transaction verification failed.");
        } finally {
            setIsUpdating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard: " + text);
    };

    if (isLoading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Synchronizing Record Trace...</p>
        </div>
    );

    if (!order) return null;

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans pb-40">

            {/* 1. TOP UTILITY HEADER - Compact & Professional */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-50 border border-slate-200 transition-all">
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div className="h-8 w-px bg-slate-100" />
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Review Workspace /</span>
                        <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">{order.order_number}</h1>
                        <OrderStatusBadge status={order.status} className="scale-75 origin-left" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => window.print()} className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Printer className="w-3.5 h-3.5" />
                        Print Invoice
                    </button>
                    <button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg">
                        <Download className="w-3.5 h-3.5" />
                        Export PDF
                    </button>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-10 items-start">

                {/* LEFT PRIMARY COLUMN */}
                <div className="col-span-12 lg:col-span-8 space-y-10">

                    {/* SECTION 1: ORDER SUMMARY HERO (Dense Version) */}
                    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm grid grid-cols-4 divide-x divide-slate-100">
                        <SummaryStat icon={<Package className="text-blue-500" />} label="Manifest Status" value={order.status} subValue="Live Tracking" />
                        <SummaryStat icon={<DollarSign className="text-emerald-500" />} label="Payment Settlement" value={order.payment_status} subValue={order.payment_method_name} highlight />
                        <SummaryStat icon={<Calendar className="text-amber-500" />} label="Lifecycle Start" value={format(new Date(order.created_at), "MMM d, yyyy")} subValue={format(new Date(order.created_at), "HH:mm:ss")} />
                        <SummaryStat
                            icon={<User className="text-fuchsia-500" />}
                            label="Customer Identity"
                            value={order.customer_name || "Guest Checkout"}
                            subValue={order.customer_email ? "Registered Account" : "Guest User (No Account)"}
                        />
                    </section>

                    {/* SECTION 2: ORDER ITEMS (Highest Priority Table) */}
                    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Box className="w-4 h-4 text-slate-400" />
                                Ordered Manifest & Specifications
                            </h2>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{order.item_count} Items Validated</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#fafbfc] border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Product Detailing</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">SKU/Variant</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-center">Qty</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">Unit Price</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {order.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-20 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 relative group/img cursor-zoom-in">
                                                        {(() => {
                                                            const itemImg = item.thumbnail || item.image || item.product_image;
                                                            return itemImg ? (
                                                                <>
                                                                    <img
                                                                        src={getMediaUrl(itemImg)}
                                                                        className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-500"
                                                                        alt={item.product_name}
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x150?text=No+Image';
                                                                        }}
                                                                    />
                                                                    <div
                                                                        onClick={() => window.open(getMediaUrl(itemImg), "_blank")}
                                                                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                                                                    >
                                                                        <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <Package className="w-6 h-6 text-slate-200" />
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-blue-600 transition-colors">{item.product_name}</p>
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            <SpecTag icon={<Tag />} label="Kurti" theme="slate" />
                                                            <SpecTag icon={<Layers />} label="Signature Collection" theme="blue" />
                                                            <SpecTag icon={<Palette />} label="Natural White" theme="amber" />
                                                        </div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">Note: Handle with care</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5">
                                                    <div className="text-[9px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md inline-block uppercase tracking-widest border border-slate-200">SKU: {item.sku}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter italic font-serif">Size: {item.variant_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-[11px] font-black text-slate-900 bg-slate-50 h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 mx-auto shadow-inner">{item.quantity}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono">
                                                <p className="text-[11px] font-black text-slate-900">Rs {item.unit_price}</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase line-through">Rs {((parseFloat(item.unit_price) * 1.1).toFixed(2))}</p>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <p className="text-[13px] font-black text-slate-900 tracking-tight">Rs {item.line_total}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-10">
                        {/* SECTION 3: PAYMENT DETAILS */}
                        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                    Payment Intelligence
                                </h2>
                                <PaymentStatusBadge status={order.payment_status} className="scale-75" />
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
                                <DataPoint label="Strategy" value={order.payment_method_name} />
                                <DataPoint label="Provider" value={transaction?.payment_method_name || "Nabil Bank"} />
                                <DataPoint label="Settle Status" value={transaction?.status || order.payment_status} highlight />
                                <DataPoint label="Reference" value={transaction?.id.slice(0, 10) || "N/A"} mono action={() => copyToClipboard(transaction?.id || "")} />
                                <DataPoint label="Settled Amount" value={`Rs ${order.total_price}`} />
                                <DataPoint label="Currency" value="NPR" />
                                <DataPoint label="Time Anchor" value={transaction?.updated_at ? format(new Date(transaction.updated_at), "MMM d, HH:mm:ss") : "Awaiting Info"} />
                                <DataPoint label="Gateway Auth" value="APPROVED" color="emerald" />
                            </div>
                        </section>

                        {/* SECTION 4: PAYMENT PROOF */}
                        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                                    Settlement Evidence
                                </h2>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">{transaction ? "Linked Audit" : "No Proof Found"}</span>
                            </div>
                            <div className="flex-1 p-6 flex flex-col items-center justify-center">
                                {(() => {
                                    const proofUrl = transaction?.proofs?.[0]?.image_url || transaction?.proofs?.[0]?.image || transaction?.proof_image || transaction?.image;
                                    return proofUrl ? (
                                        <div className="w-full space-y-4">
                                            <div className="relative group aspect-square bg-slate-50 border border-slate-100 rounded-lg overflow-hidden p-1 shadow-inner flex items-center justify-center">
                                                <img src={getMediaUrl(proofUrl)} className="max-w-full max-h-full object-contain" alt="Payment Proof" />
                                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                                    <button onClick={() => window.open(getMediaUrl(proofUrl), "_blank")} className="h-9 w-9 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-xl hover:scale-110 transition-transform">
                                                        <Maximize2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => window.open(getMediaUrl(proofUrl), "_blank")} className="h-9 w-9 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-xl hover:scale-110 transition-transform">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Verified By</p>
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none italic">Admin System</p>
                                                </div>
                                                <div className="text-right space-y-0.5">
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Timestamp</p>
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none italic">{format(new Date(transaction?.updated_at || transaction?.created_at || new Date()), "MMM d, HH:mm")}</p>
                                                </div>
                                            </div>

                                            {/* FINANCE WORKBENCH: Audit Decision Actions */}
                                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Finance Action Required</p>
                                                    <span className={cn(
                                                        "text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest",
                                                        transaction.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            transaction.status === "REJECTED" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                                                    )}>
                                                        {transaction.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleVerifyTransaction("APPROVED")}
                                                        disabled={isUpdating || transaction.status === "APPROVED"}
                                                        className="h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Confirm Payment
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerifyTransaction("REJECTED")}
                                                        disabled={isUpdating || transaction.status === "REJECTED"}
                                                        className="h-10 bg-rose-50 border border-rose-100 hover:bg-rose-100 disabled:opacity-30 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Mark Void
                                                    </button>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 italic text-center">Caution: Transaction verification triggers immediate financial settlement.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-3 py-10 opacity-30">
                                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Digital Proof Unavailable</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>
                    </div>

                    {/* SECTION 8: ORDER TIMELINE (Relocated to Main Stream) */}
                    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                Operational Audit Trail
                            </h2>
                        </div>
                        <div className="p-10 space-y-10">
                            <div className="relative border-l-2 border-slate-100 ml-4 pl-10 space-y-12">
                                {order.status_history.slice().reverse().map((event: any, idx: number) => (
                                    <div key={idx} className="relative group">
                                        <div className="absolute -left-[51px] top-0 w-5 h-5 bg-white border-2 border-slate-300 rounded-full transition-all group-first:border-slate-900 group-first:bg-slate-900 group-first:scale-125 z-10" />
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-md border border-slate-100">{event.status}</span>
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(event.created_at), "MMM d, yyyy - HH:mm:ss")}
                                                </div>
                                            </div>
                                            {event.notes && (
                                                <div className="max-w-2xl bg-[#fafafa] p-6 rounded-xl border-l-[3px] border-slate-900 text-[11px] font-medium text-slate-600 leading-relaxed italic shadow-sm">
                                                    "{event.notes}"
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                                                <User className="w-2.5 h-2.5" />
                                                Staff: Operational Admin Agent
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                </div>

                {/* RIGHT SIDEBAR COLUMN */}
                <div className="col-span-12 lg:col-span-4 space-y-10 lg:sticky lg:top-24">

                    {/* SECTION 6: CUSTOMER DETAILS */}
                    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                Customer Intelligence
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xl font-black italic shadow-xl">
                                    {(order.customer_name || "GU").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.customer_name || "Guest User"}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                        {order.customer_email ? "Primary Account Holder" : "One-Time Checkout Profile"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <SidebarStat icon={<Mail />} label="Email Address" value={order.customer_email || "N/A"} action={() => copyToClipboard(order.customer_email)} />
                                <SidebarStat icon={<Phone />} label="Communication" value={order.customer_phone} />
                                <SidebarStat icon={<Tag />} label="Loyalty Tier" value={order.customer_email ? "Registered Customer" : "Guest (No Tier)"} />
                                <SidebarStat icon={<Calendar />} label="Client Since" value={order.customer_email ? "June 2024" : "N/A"} />
                            </div>
                            <button className="w-full h-10 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                <ExternalLink className="w-3.5 h-3.5" />
                                View Full Purchase History
                            </button>
                        </div>
                    </section>

                    {/* SECTION 7: SHIPPING INFORMATION */}
                    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                Logistics & Delivery
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Recipient Name</p>
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">{order.customer_name}</p>
                                <p className="text-[10px] font-bold text-slate-500">{order.customer_phone}</p>
                            </div>
                            <div className="space-y-2.5">
                                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                                    <p className="text-[11px] font-bold text-slate-600 leading-snug">{order.shipping_street}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.shipping_city}, {order.shipping_district}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{order.shipping_province}, 44600, Nepal</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Method</p>
                                    <p className="text-[10px] font-black text-slate-900 uppercase">Surface Courier</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">ETA</p>
                                    <p className="text-[10px] font-black text-slate-900 uppercase">{order.arrival_estimate || "3-5 Business Days"}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 5: ORDER PRICING */}
                    <section className="bg-slate-900 text-white rounded-xl shadow-2xl p-8 space-y-6 relative overflow-hidden border-4 border-slate-800">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <Receipt className="w-32 h-32" />
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Financial Ledger</h2>
                        <div className="space-y-4 relative z-10">
                            <PriceRow label="Manifest Subtotal" value={`Rs ${order.subtotal}`} />
                            <PriceRow label="Voucher Discount" value="- Rs 0.00" color="text-rose-400" />
                            <PriceRow label="Logistic Logistics" value={`+ Rs ${order.shipping_fee}`} />
                            <PriceRow label="Taxation (VAT)" value="+ Rs 0.00" />
                            <div className="h-px bg-white/10 my-4" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Total Settlement</span>
                                <span className="text-2xl font-black italic tracking-tighter">Rs {order.total_price}</span>
                            </div>
                            <div className="pt-4 flex items-center justify-center">
                                <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                                    Final Consolidated Invoice Amount
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

            </main>

            {/* SECTION 9: ADMIN DECISION PANEL (Fixed at bottom) */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-900 p-8 z-[60] shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-10 items-center">

                    <div className="col-span-3 space-y-2">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Decision Matrix
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-snug">Verify all customer assets before committing record change.</p>
                    </div>

                    <div className="col-span-6 relative">
                        <MessageSquare className="absolute right-6 top-5 w-4 h-4 text-slate-200" />
                        <textarea
                            placeholder="Enter resolution message (Visible to customer upon action)..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-100 min-h-[90px] resize-none transition-all placeholder:text-slate-300 italic"
                        />
                        <div className="absolute bottom-4 right-6 text-[8px] font-black text-slate-300 uppercase tracking-widest">Permanent Transaction Log Entry</div>
                    </div>

                    <div className="col-span-3 grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <ActionBtn icon={<PauseCircle />} label="Hold Process" color="amber" onClick={() => handleAction("PROCESSING")} disabled={isUpdating || order.status === "PROCESSING"} />
                            <ActionBtn icon={<XCircle />} label="Cancel Order" color="rose" onClick={() => handleAction("CANCELLED")} disabled={isUpdating || order.status === "CANCELLED"} />
                        </div>
                        <button
                            onClick={() => handleAction("CONFIRMED")}
                            disabled={isUpdating || order.status !== "PENDING"}
                            className="w-full h-11 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                        >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            Verify & Approve Order
                        </button>
                    </div>

                </div>
            </footer>

        </div>
    );
}

// ── INTERNAL COMPONENTS ──────────────────────────────────────────────────

function SummaryStat({ icon, label, value, subValue, highlight = false }: any) {
    return (
        <div className="px-8 py-6 flex items-start gap-5 hover:bg-slate-50/50 transition-colors">
            <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                {icon}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
                <span className={cn(
                    "text-sm font-black tracking-tighter uppercase truncate",
                    highlight ? "text-slate-900" : "text-slate-900"
                )}>{value}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60 leading-none truncate">{subValue}</span>
            </div>
        </div>
    );
}

function DataPoint({ label, value, mono = false, highlight = false, color, action }: any) {
    return (
        <div className="space-y-1 group">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none">{label}</p>
            <div className="flex items-center gap-2">
                <p className={cn(
                    "text-[10px] font-black uppercase tracking-tight break-all",
                    mono ? "font-mono text-slate-500" : "text-slate-900 italic",
                    highlight ? "bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded" : "",
                    color === "emerald" ? "text-emerald-500" : ""
                )}>
                    {value}
                </p>
                {action && <button onClick={action} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3 text-slate-300 hover:text-slate-900" /></button>}
            </div>
        </div>
    );
}

function SpecTag({ icon, label, theme }: any) {
    const themes: any = {
        slate: "bg-slate-50 text-slate-400 border-slate-200",
        blue: "bg-blue-50 text-blue-500 border-blue-100",
        amber: "bg-amber-50 text-amber-500 border-amber-100"
    };
    return (
        <div className={cn("px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest flex items-center gap-1", themes[theme])}>
            {icon && <span className="w-2 h-2 opacity-50">{icon}</span>}
            {label}
        </div>
    );
}

function SidebarStat({ icon, label, value, action }: any) {
    return (
        <div className="flex items-start gap-3 group">
            <div className="h-7 w-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                {icon && <span className="w-3.5 h-3.5 text-slate-400">{icon}</span>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-900 truncate leading-none">{value}</p>
                    {action && <button onClick={action} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-2.5 h-2.5 text-slate-300" /></button>}
                </div>
            </div>
        </div>
    );
}

function PriceRow({ label, value, color = "text-white/60" }: any) {
    return (
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
            <span className="text-white/40">{label}</span>
            <span className={color}>{value}</span>
        </div>
    );
}

function ActionBtn({ icon, label, color, onClick, disabled }: any) {
    const colors: any = {
        amber: "border-amber-200 text-amber-600 hover:bg-amber-50",
        rose: "border-rose-200 text-rose-600 hover:bg-rose-50"
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-10 border rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-30",
                colors[color]
            )}
        >
            <span className="w-3.5 h-3.5">{icon}</span>
            {label}
        </button>
    );
}
