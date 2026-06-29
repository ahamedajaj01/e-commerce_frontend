"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchBackofficeTransactionDetails, verifyTransaction } from "@/lib/api/payments";
import { fetchBackofficeOrderDetails } from "@/lib/api/orders";
import { Transaction, PaymentStatus } from "@/types/payment";
import { Order } from "@/types/order";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import {
    ChevronLeft,
    ShieldCheck,
    Image as ImageIcon,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    Fingerprint,
    CreditCard,
    FileText,
    MessageSquare,
    User,
    History as HistoryIcon,
    ArrowRight,
    ExternalLink,
    Mail,
    Phone,
    Banknote,
    Receipt,
    Maximize2,
    Download,
    Clock,
    Lock
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getMediaUrl, cn } from "@/lib/utils";

export default function TransactionDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const [tx, setTx] = useState<Transaction | any>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [notes, setNotes] = useState("");

    const loadData = async () => {
        if (!token || !id) return;
        setIsLoading(true);
        try {
            const txData = await fetchBackofficeTransactionDetails(id as string, token);
            // Debug log to check field names for proof image
            console.log("[Audit] Transaction Data Payload:", txData);
            setTx(txData);

            if (txData.order_id) {
                const orderData = await fetchBackofficeOrderDetails(txData.order_id, token);
                setOrder(orderData);
            }
        } catch (err) {
            console.error("Failed to load audit trace:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [id, token]);

    const handleVerify = async (status: "APPROVED" | "REJECTED") => {
        if (!token || !id || !tx) return;
        setIsVerifying(true);
        try {
            await verifyTransaction(id as string, { status, notes } as any, token);
            await loadData();
            setNotes("");
        } catch (err: any) {
            alert(err.message || "Financial verification protocol failed.");
        } finally {
            setIsVerifying(false);
        }
    };

    // Determine the actual proof image field (checking for fallbacks like 'proof' or 'image')
    const proofUrl = tx?.proof_image || tx?.proof || tx?.image;

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verifying Ledger Integrity...</p>
        </div>
    );

    if (!tx) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">

            {/* TOOLBAR HEADER - Shopify/Linear Style */}
            <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Transaction /</span>
                            <h1 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{tx.id.slice(0, 8)}...</h1>
                            <PaymentStatusBadge status={tx.status} className="scale-75" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-8 w-px bg-slate-100 mx-2" />
                    <button className="h-8 px-3 rounded-lg border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Download className="w-3.5 h-3.5" />
                        Export Audit
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">

                {/* PRIMARY CONTENT area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">

                    {/* TOP SUMMARY - Border-based Table Style */}
                    <div className="grid grid-cols-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-x divide-slate-100">
                        <SummaryPill label="Settlement Amount" value={`Rs ${tx.amount}`} subValue="Gross Valuation" icon={<Banknote className="w-4 h-4 text-emerald-500" />} />
                        <SummaryPill label="Reference Code" value={`#${tx.order_number}`} subValue="Order Manifest" icon={<Receipt className="w-4 h-4 text-blue-500" />} />
                        <SummaryPill label="Payment Network" value={tx.payment_method_name} subValue="Settle Strategy" icon={<CreditCard className="w-4 h-4 text-amber-500" />} />
                        <SummaryPill label="Entry Date" value={format(new Date(tx.created_at), "MMM d, yyyy")} subValue={format(new Date(tx.created_at), "HH:mm:ss")} icon={<Clock className="w-4 h-4 text-slate-400" />} />
                    </div>

                    {/* TWO COLUMN GRID */}
                    <div className="grid grid-cols-12 gap-8 items-start">

                        {/* LEFT: EVIDENCE */}
                        <div className="col-span-8 space-y-8">
                            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <h2 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                        Documentary Proof of Settle
                                    </h2>
                                    {proofUrl && (
                                        <button
                                            onClick={() => window.open(getMediaUrl(proofUrl), "_blank")}
                                            className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                                        >
                                            <Maximize2 className="w-3 h-3" />
                                            Inspect High-Res
                                        </button>
                                    )}
                                </div>

                                <div className="p-8 flex items-center justify-center bg-slate-50/30">
                                    {proofUrl ? (
                                        <div className="relative group max-w-2xl w-full border-4 border-white shadow-2xl rounded-lg overflow-hidden bg-white">
                                            <img
                                                src={getMediaUrl(proofUrl)}
                                                alt="Payment Proof"
                                                className="w-full h-auto object-contain transition-all duration-700 hover:scale-[1.01]"
                                            />
                                        </div>
                                    ) : (
                                        <div className="py-24 text-center space-y-4">
                                            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                                                <AlertTriangle className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">No Digital Proof Detected</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 italic">
                                                    Check secondary channels or manual deposits
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <HistoryIcon className="w-3.5 h-3.5 text-slate-400" />
                                        Verification Audit Trace
                                    </h2>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="space-y-8 pl-4 border-l border-slate-100 ml-1">
                                        {tx.verification_history?.length > 0 ? tx.verification_history.map((h: any, idx: number) => (
                                            <div key={idx} className="relative pl-6">
                                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <PaymentStatusBadge status={h.status} className="scale-75 origin-left" />
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">{format(new Date(h.timestamp), "MMM d, HH:mm:ss")}</span>
                                                    </div>
                                                    {h.notes && (
                                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-medium text-slate-600 italic">
                                                            "{h.notes}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic ml-4">No historical trace for this record</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: CONTEXT & CONTROLS */}
                        <div className="col-span-4 space-y-6 lg:sticky lg:top-20">

                            {/* DECISION MATRIX */}
                            <section className="bg-slate-900 rounded-xl p-6 shadow-2xl space-y-6 border border-slate-800">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Resolution Workbench</h2>
                                    <Lock className="w-3.5 h-3.5 text-white/20" />
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        placeholder="Add internal verification notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[11px] text-white/80 font-medium outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-white/20 min-h-[100px] resize-none"
                                    />
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => handleVerify("APPROVED")}
                                            disabled={isVerifying || tx.status === "APPROVED"}
                                            className="h-11 bg-emerald-500 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-20"
                                        >
                                            {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                            Verify & Authorize
                                        </button>
                                        <button
                                            onClick={() => handleVerify("REJECTED")}
                                            disabled={isVerifying || tx.status === "REJECTED"}
                                            className="h-11 bg-transparent border border-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-all disabled:opacity-20"
                                        >
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                            Reject Settlement
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* CUSTOMER INFO */}
                            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-50">
                                <div className="px-5 py-4 bg-slate-50/50">
                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification Context</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">{tx.customer_name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Settle Agent</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <ContactRow icon={<Mail className="w-3.5 h-3.5 text-slate-300" />} value={order?.customer_email || "No email provided"} />
                                        <ContactRow icon={<Phone className="w-3.5 h-3.5 text-slate-300" />} value={order?.customer_phone || "No phone provided"} />
                                    </div>
                                </div>
                                {order && (
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Linked Process</p>
                                            <OrderStatusBadge status={order.status} className="scale-75 origin-left" />
                                        </div>
                                        <Link
                                            href={`/backoffice/orders`}
                                            className="h-8 px-3 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center hover:bg-slate-50"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                )}
                            </section>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── INTERNAL COMPONENTS ──────────────────────────────────────────────────

function SummaryPill({ label, value, subValue, icon }: any) {
    return (
        <div className="px-6 py-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                {icon}
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
                <span className="text-sm font-black text-slate-900 tracking-tight">{value}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest opacity-60">{subValue}</span>
            </div>
        </div>
    );
}

function ContactRow({ icon, value }: any) {
    return (
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-100/50">
            {icon}
            <span className="truncate">{value}</span>
        </div>
    );
}
