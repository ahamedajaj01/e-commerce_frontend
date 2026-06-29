"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchBackofficeTransactions } from "@/lib/api/payments";
import { Transaction, PaymentStatus } from "@/types/payment";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import {
    Search,
    Filter,
    Eye,
    Calendar,
    User,
    CreditCard,
    ArrowUpRight,
    Loader2,
    ChevronLeft,
    ChevronRight,
    SearchX,
    History as HistoryIcon,
    RefreshCw,
    ShieldCheck,
    Receipt,
    Clock,
    RotateCcw
} from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { TransactionDrawer } from "@/components/backoffice/payments/TransactionDrawer";

export default function TransactionsPage() {
    const { token } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [drawerTxId, setDrawerTxId] = useState<string | null>(null);

    const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchBackofficeTransactions({
                token,
                search: search || undefined,
                status: statusFilter || undefined,
                page
            });
            setTransactions(data.results || []);
            setTotalCount(data.count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(load, 500);
        return () => clearTimeout(timer);
    }, [token, search, statusFilter, page]);

    return (
        <div className="flex flex-col h-screen bg-white text-slate-900 font-sans selection:bg-slate-100 antialiased overflow-hidden">

            {/* 1. Operational Header */}
            <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-bold tracking-tight text-slate-900">Settlement Registry</h1>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase tracking-widest border border-emerald-100 italic">Gateway Active</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">Finance Audit Protocol & Reconciliation Interface.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-8 group flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 rounded-md text-slate-400">
                        <Receipt className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Global Log: <span className="text-slate-900 tabular-nums">{totalCount} Record Trace</span></span>
                    </div>
                    <button
                        onClick={load}
                        className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                    </button>
                </div>
            </header>

            {/* 2. Tactical Toolbar */}
            <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                        <input
                            type="text"
                            placeholder="Reference, customer, or audit ID..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full h-9 bg-slate-50 border-slate-100 border rounded-lg pl-10 pr-4 text-[11px] font-medium focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {[
                            { label: "Full Stream", val: "" },
                            { label: "Submitted", val: "SUBMITTED" },
                            { label: "Paid", val: "APPROVED" },
                            { label: "Rejected", val: "REJECTED" },
                        ].map(st => (
                            <button
                                key={st.val}
                                onClick={() => { setStatusFilter(st.val); setPage(1); }}
                                className={cn(
                                    "h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                                    statusFilter === st.val
                                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                                )}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>

                    {statusFilter && (
                        <button
                            onClick={() => { setStatusFilter(""); setPage(1); }}
                            className="h-9 w-9 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-50"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* 3. Transaction Stream Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col bg-white">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Synchronizing Vault Cache...</p>
                    </div>
                )}

                <div className="flex-1 overflow-auto no-scrollbar pb-24 relative">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                        <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100 shadow-sm text-slate-400">
                            <tr>
                                <th className="w-48 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Audit ID</th>
                                <th className="w-48 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Order Ref</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Client & Strategy</th>
                                <th className="w-36 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Settlement</th>
                                <th className="w-36 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Status</th>
                                <th className="w-40 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Time Anchor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.length === 0 && !isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <SearchX className="w-6 h-6" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">No Operational Records Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        onClick={() => setDrawerTxId(tx.id)}
                                        className={cn(
                                            "group hover:bg-slate-50/80 transition-all cursor-pointer border-l-2 border-transparent",
                                            drawerTxId === tx.id && "bg-slate-50 border-l-slate-900"
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <HistoryIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                                <span className="text-[11px] font-mono text-slate-400 group-hover:text-slate-900 transition-colors uppercase tabular-nums">{tx.id.slice(0, 10)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight uppercase tabular-nums">#{tx.order_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 uppercase ring-1 ring-slate-200 group-hover:bg-white transition-all shadow-sm">
                                                    {tx.customer_name?.charAt(0) || "?"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-700 tracking-tight uppercase">{tx.customer_name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5 flex items-center gap-1">
                                                        <CreditCard className="w-2.5 h-2.5" />
                                                        {tx.payment_method_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-black text-slate-900 uppercase tabular-nums tracking-tighter">Rs. {tx.amount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <PaymentStatusBadge status={tx.status} className="scale-90" />
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 group-hover:text-slate-900 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap tabular-nums">
                                                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: false })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. Operations Pagination */}
                <div className="shrink-0 px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between z-40">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                            <span className="text-slate-400">Vault Page</span>
                            <span>{page} / {Math.ceil(totalCount / 10) || 1}</span>
                        </div>
                        <div className="h-3 w-px bg-slate-200" />
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Live Stream: <span className="text-slate-900">{transactions.length} Records</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="h-8 px-3 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            disabled={transactions.length < 10}
                            onClick={() => setPage(p => p + 1)}
                            className="h-8 px-3 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </main>

            {/* 5. Intelligence Drawer */}
            {token && (
                <TransactionDrawer
                    transactionId={drawerTxId}
                    token={token}
                    onClose={() => setDrawerTxId(null)}
                    onUpdate={load}
                />
            )}

        </div>
    );
}
