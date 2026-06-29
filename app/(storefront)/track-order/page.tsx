"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { trackOrder } from "@/lib/api/orders";
import type { TrackedOrder, OrderStatus } from "@/types/order";
import {
    Search,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    Loader2,
    Calendar,
    AlertCircle,
    ArrowRight,
    MapPin,
    CreditCard,
    ShieldCheck,
    Box,
    Send,
    Home,
    CircleDashed,
    Check,
    History,
    Link as LinkIcon
} from "lucide-react";
import { cn, getMediaUrl } from "@/lib/utils";
import { format } from "date-fns";
import { XCircle } from "lucide-react";

const TIMELINE_STEPS = [
    { id: "PLACED", label: "Order Placed", description: "Your order has been recorded in our system." },
    { id: "CONFIRMED", label: "Order Confirmed", description: "The store has acknowledged and verified your order." },
    { id: "PROCESSING", label: "Processing", description: "Your items are being picked and packed." },
    { id: "SHIPPED", label: "Shipped", description: "Package is in transit to your local delivery station." },
    { id: "DELIVERED", label: "Delivered", description: "Successfully handed over to the customer." },
];

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialNumber = searchParams.get("number") || "";

    const [orderNumber, setOrderNumber] = useState(initialNumber);
    const [result, setResult] = useState<TrackedOrder | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!orderNumber.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await trackOrder(orderNumber.trim());
            setResult(data);
            router.push(`/track-order?number=${orderNumber.trim()}`, { scroll: false });
        } catch (err: any) {
            setError(err.message || "Reference not found. Please verify the number.");
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialNumber && !result && !isLoading) {
            handleSearch();
        }
    }, [initialNumber]);

    // Determine current progression
    const getStepStatus = (stepId: string) => {
        if (!result) return "inactive";

        const { status } = result;
        if (status === "CANCELLED") return "inactive";

        // Step mapping based on simplified flow
        const statusPriority: Record<OrderStatus, number> = {
            "PENDING": 1,
            "CONFIRMED": 2,
            "PROCESSING": 3,
            "READY_TO_DISPATCH": 3, // Grouped with processing
            "DISPATCHED": 4,        // Grouped with shipped
            "SHIPPED": 4,
            "DELIVERED": 5,
            "CANCELLED": 0
        };

        const stepPriority: Record<string, number> = {
            "PLACED": 1,
            "CONFIRMED": 2,
            "PROCESSING": 3,
            "SHIPPED": 4,
            "DELIVERED": 5
        };

        const currentP = statusPriority[status] || 1;
        const targetP = stepPriority[stepId];

        if (currentP > targetP) return "complete";
        if (currentP === targetP) return "active";
        return "inactive";
    };

    return (
        <div className="bg-[#fcfcfc] min-h-screen text-slate-900 pb-32 pt-24 font-outfit selection:bg-slate-100">
            <ResponsiveContainer>
                <div className="max-w-3xl mx-auto space-y-20">

                    {/* 1. MINIMAL SEARCH SECTION */}
                    <div className="text-center space-y-8">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Track Your Order</h1>
                            <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                                Enter your order reference number to check the latest order progress.
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="max-w-xl mx-auto group">
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="ORD-2026-XXXXXX"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                    className="w-full bg-white border border-slate-100 rounded-2xl py-6 pl-16 pr-36 text-sm font-bold tracking-widest placeholder:text-slate-200 focus:ring-4 focus:ring-slate-50 focus:border-slate-200 transition-all shadow-sm shadow-slate-100/50"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="absolute right-3 top-3 bottom-3 px-8 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-4 text-xs font-bold text-rose-500 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {error}
                                </p>
                            )}
                        </form>
                    </div>

                    {result ? (
                        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">

                            {/* 2. OPERATIONAL SUMMARY */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm shadow-slate-100/50">
                                <SummaryItem label="Order Reference" value={`#${result.order_number}`} />
                                <SummaryItem
                                    label="Order Status"
                                    value={result.status}
                                    badge
                                    badgeColor={
                                        result.status === "DELIVERED" ? "emerald" :
                                            result.status === "CANCELLED" ? "rose" : "blue"
                                    }
                                />
                                <SummaryItem
                                    label="Payment Status"
                                    value={result.payment_status}
                                    badge
                                    badgeColor={result.payment_status === "PAID" ? "emerald" : "amber"}
                                />
                                <SummaryItem label="Estimated Delivery" value={result.status === "CANCELLED" ? "No ETA" : (result.arrival_estimate || "3-5 Business Days")} uppercase={false} />
                            </div>

                            {/* CANCELLED STATE HIGHLIGHT */}
                            {result.status === "CANCELLED" && (
                                <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-500">
                                    <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-rose-200">
                                        <XCircle className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-bold text-rose-950 uppercase tracking-tight">Order Cancelled</h2>
                                        <p className="text-[11px] font-medium text-rose-600 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                                            This order has been officially terminated. If you have questions regarding this cancellation, please contact our support desk.
                                        </p>
                                    </div>
                                    {result.status_timeline?.find(h => h.new_status === "CANCELLED") && (
                                        <div className="px-6 py-2 bg-white/60 rounded-full text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] border border-rose-100">
                                            Cancelled on {format(new Date(result.status_timeline.find(h => h.new_status === "CANCELLED")!.created_at), "MMMM d, HH:mm")}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. PRODUCT SUMMARY (COMPACT) */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 ml-2">Shipment Contents</h3>
                                {result.items && result.items.length > 0 && (
                                    <div className="space-y-3">
                                        {result.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-6 p-4 bg-white border border-slate-50 rounded-2xl group hover:border-slate-100 transition-colors">
                                                <div className="h-16 w-16 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={getMediaUrl(item.thumbnail)}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        alt={item.product_name}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-900 truncate">{item.product_name}</h4>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {item.variant_name?.split(" / ").map((spec, sidx) => (
                                                            <span key={sidx} className="flex items-center gap-1.5">
                                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Quantity</p>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">x{item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 4. MODERN PROGRESS TIMELINE */}
                            <div className="space-y-10 py-10">
                                <div className="flex flex-col gap-12 relative max-w-xl mx-auto">
                                    {/* Vertical Connector Path */}
                                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100" />

                                    {TIMELINE_STEPS.map((step, idx) => {
                                        const status = getStepStatus(step.id);
                                        const historyEntry = result.status_timeline?.find((h: any) => h.new_status === step.id);

                                        return (
                                            <div key={step.id} className={cn(
                                                "relative pl-14 transition-all duration-500",
                                                status === "inactive" ? "opacity-30 grayscale" : "opacity-100"
                                            )}>
                                                {/* Node ICON */}
                                                <div className={cn(
                                                    "absolute left-0 top-0.5 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10",
                                                    status === "complete" ? "bg-slate-900 border-slate-900 text-white" :
                                                        status === "active" ? "bg-white border-slate-900 text-slate-900 shadow-xl shadow-slate-100" :
                                                            "bg-white border-slate-100 text-slate-200"
                                                )}>
                                                    {status === "complete" ? (
                                                        <Check className="w-5 h-5 stroke-[3px]" />
                                                    ) : (
                                                        <StepIcon id={step.id} />
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className={cn(
                                                            "text-[13px] font-bold tracking-tight uppercase transition-colors",
                                                            status === "inactive" ? "text-slate-400" : "text-slate-900"
                                                        )}>
                                                            {step.label}
                                                        </h5>
                                                        {historyEntry && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                                                                {format(new Date(historyEntry.created_at), "MMM d, HH:mm")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-sm">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    ) : !isLoading && (
                        <div className="bg-white rounded-[3rem] p-24 border border-slate-100 text-center space-y-10 shadow-sm shadow-slate-50/50 max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                <Box className="w-10 h-10" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Personal Logistics Feed</h3>
                                <p className="text-[11px] font-medium text-slate-400 max-w-xs mx-auto uppercase tracking-[0.2em] leading-relaxed italic">
                                    Your real-time progress map will materialize here once a valid reference is identified.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </ResponsiveContainer>
        </div>
    );
}

// ── INTERNAL HELPERS ──────────────────────────────────────────────────

function SummaryItem({ label, value, badge = false, badgeColor = "blue", uppercase = true }: any) {
    return (
        <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{label}</p>
            {badge ? (
                <div className={cn(
                    "inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                    badgeColor === "emerald" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                    {value}
                </div>
            ) : (
                <p className={cn("text-sm font-black text-slate-900 tracking-tight", uppercase && "uppercase")}>{value}</p>
            )}
        </div>
    );
}

function StepIcon({ id }: { id: string }) {
    switch (id) {
        case "PLACED": return <History className="w-5 h-5" />;
        case "CONFIRMED": return <CheckCircle2 className="w-5 h-5" />;
        case "PAID_WAITING": return <ShieldCheck className="w-5 h-5" />;
        case "PAID_VERIFIED": return <CreditCard className="w-5 h-5" />;
        case "PROCESSING": return <Package className="w-5 h-5" />;
        case "READY_TO_DISPATCH": return <LinkIcon className="w-5 h-5" />;
        case "DISPATCHED": return <Send className="w-5 h-5" />;
        case "SHIPPED": return <Truck className="w-5 h-5" />;
        case "DELIVERED": return <Home className="w-5 h-5" />;
        default: return <CircleDashed className="w-5 h-5" />;
    }
}

export default function TrackOrderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>}>
            <TrackOrderContent />
        </Suspense>
    );
}
