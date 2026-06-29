"use client";

import { useState, useEffect } from "react";
import {
    X,
    ShieldCheck,
    DollarSign,
    Calendar,
    Maximize2,
    Download,
    Loader2,
    CheckCircle2,
    XCircle,
    History,
    Link as LinkIcon,
    FileText,
    Copy,
    ExternalLink,
    AlertCircle,
    User,
    CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { cn, getMediaUrl } from "@/lib/utils";
import { fetchBackofficeTransactionDetails, verifyTransaction } from "@/lib/api/payments";
import { Transaction } from "@/types/payment";
import Link from "next/link";

interface TransactionDrawerProps {
    transactionId: string | null;
    token: string;
    onClose: () => void;
    onUpdate: () => void;
}

export function TransactionDrawer({ transactionId, token, onClose, onUpdate }: TransactionDrawerProps) {
    const [tx, setTx] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (transactionId && token) {
            loadDetails();
        } else {
            setTx(null);
            setNotes("");
        }
    }, [transactionId, token]);

    const loadDetails = async () => {
        setIsLoading(true);
        try {
            const data = await fetchBackofficeTransactionDetails(transactionId!, token);
            setTx(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (status: "APPROVED" | "REJECTED") => {
        if (!tx || !token) return;

        const confirmMsg = `Permanently mark transaction [${tx.id.slice(0, 8)}] as ${status}? This action is final and will settle the linked order funds.`;
        if (!window.confirm(confirmMsg)) return;

        setIsVerifying(true);
        try {
            await verifyTransaction(tx.id, { approve: status === "APPROVED", notes }, token);
            alert(`Financial Record: ${status}`);
            onUpdate();
            onClose();
        } catch (err: any) {
            alert(err.message || "Financial verification protocol failed.");
        } finally {
            setIsVerifying(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard: " + text);
    };

    if (!transactionId) return null;

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] transition-opacity duration-500",
                    transactionId ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <div className={cn(
                "fixed inset-y-0 right-0 w-full max-w-[500px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] z-[110] transform transition-transform duration-500 ease-in-out flex flex-col border-l border-slate-200",
                transactionId ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="shrink-0 p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Financial Audit</h3>
                                <div className={cn(
                                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                    tx?.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        tx?.status === "REJECTED" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                            "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                                )}>
                                    {tx?.status || "PENDING"}
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{transactionId.slice(0, 12)}... Audit Session</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Decrypting Transaction Trace...</p>
                    </div>
                ) : tx ? (
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-10">

                            {/* SECTION 1: SETTLEMENT PROOF (CRITICAL) */}
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    Digital Evidence
                                </h4>
                                {(() => {
                                    const proofUrl = tx.proofs?.[0]?.image_url || tx.proofs?.[0]?.image || tx.proof_image || tx.image;
                                    return proofUrl ? (
                                        <div className="group relative aspect-[4/5] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden p-1 shadow-inner flex items-center justify-center">
                                            <img src={getMediaUrl(proofUrl)} className="max-w-full max-h-full object-contain" alt="Proof" />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                                <button onClick={() => window.open(getMediaUrl(proofUrl), "_blank")} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-xl hover:scale-110 transition-transform">
                                                    <Maximize2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => window.open(getMediaUrl(proofUrl), "_blank")} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-xl hover:scale-110 transition-transform">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[4/3] bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 opacity-40">
                                            <AlertCircle className="w-8 h-8 text-slate-300" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment image not found</p>
                                        </div>
                                    );
                                })()}
                            </section>

                            {/* SECTION 2: SETTLEMENT ARCHITECT */}
                            <section className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Financial Manifest
                                </h4>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <DataRow label="Linked Order" value={tx.order_number} action={() => copyToClipboard(tx.order_number)} highlight />
                                    <DataRow label="Strategy" value={tx.payment_method_name} />
                                    <DataRow label="Amount" value={`Rs ${tx.amount}`} />
                                    <DataRow label="Lifecycle" value={format(new Date(tx.created_at), "MMM d, HH:mm")} />
                                    <div className="col-span-2 pt-2">
                                        <Link href={`/backoffice/orders/${tx.order_id}`} className="w-full h-10 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Inspect Order Workspace
                                        </Link>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3: DECISION WORKBENCH */}
                            <section className="space-y-6 pb-20">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Audit Decision
                                </h4>
                                <div className="space-y-4">
                                    <textarea
                                        placeholder="Enter finance audit notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-100 transition-all resize-none italic placeholder:text-slate-300"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleVerify("APPROVED")}
                                            disabled={isVerifying || tx.status === "APPROVED"}
                                            className="h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-100"
                                        >
                                            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Confirm Funds
                                        </button>
                                        <button
                                            onClick={() => handleVerify("REJECTED")}
                                            disabled={isVerifying || tx.status === "REJECTED"}
                                            className="h-12 bg-white border border-rose-200 hover:bg-rose-50 disabled:opacity-30 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject Settlement
                                        </button>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}

function DataRow({ label, value, highlight, action }: any) {
    return (
        <div className="space-y-1 group">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{label}</p>
            <div className="flex items-center gap-2">
                <p className={cn(
                    "text-[10px] font-black uppercase tracking-tight",
                    highlight ? "text-blue-600" : "text-slate-900"
                )}>
                    {value}
                </p>
                {action && (
                    <button onClick={action} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy className="w-3 h-3 text-slate-300" />
                    </button>
                )}
            </div>
        </div>
    );
}
