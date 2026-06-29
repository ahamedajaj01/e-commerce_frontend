"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { fetchOrderDetails } from "@/lib/api/orders"; // Wait, how to fetch by order_number? 
// The backend usually returns the whole order result on completion.
// If we redirect to /order-success?order_number=XYZ, we might need a specific endpoint or just show what we have.
// Actually, the completion result returns order_number and id.
import { Order } from "@/types/order";
import {
    PackageCheck,
    ShoppingBag,
    ClipboardList,
    ChevronRight,
    Loader2,
    Truck
} from "lucide-react";
import Link from "next/link";
import { OrderItemCard } from "@/components/orders/OrderItemCard";

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get("order_number");
    const orderId = searchParams.get("id");

    // We could fetch the full order details using orderId if available
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(!!orderId);

    useEffect(() => {
        if (!orderId) return;

        // Since this is a "success" page, the user might not be logged in (guest)
        // But they just finished the checkout. The session might be over.
        // However, the fetchOrderDetails requires a token. 
        // For now, let's assume if orderId is present and they aren't logged in, 
        // we just show the order number.
    }, [orderId]);

    return (
        <div className="bg-white min-h-screen text-slate-900 pb-20 pt-10 lg:pt-20">
            <ResponsiveContainer>
                <div className="max-w-3xl mx-auto space-y-12">

                    {/* Hero Success */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 lg:p-20 text-center space-y-10 shadow-sm animate-in zoom-in duration-700">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                            <PackageCheck className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold tracking-tight">Order Successful</h1>
                            <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Thank you for your purchase. Your order has been received and is currently being processed by our team.
                            </p>
                        </div>

                        <div className="inline-flex flex-col items-center gap-2 bg-slate-50 px-10 py-6 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Order Reference</p>
                            <p className="text-2xl font-bold tracking-tight text-slate-900">#{orderNumber || 'Pending'}</p>
                        </div>
                    </div>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6 shadow-sm hover:border-slate-800 transition-all group">
                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold tracking-tight">Track Order</h3>
                                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">View real-time delivery progress and history using your reference number.</p>
                            </div>
                            <Link href={`/track-order?number=${orderNumber}`} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 hover:gap-3 transition-all">
                                Open Tracking Portal <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6 shadow-sm hover:border-slate-800 transition-all group">
                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold tracking-tight">Return to Home</h3>
                                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">Continue exploring our latest collections and curated offerings.</p>
                            </div>
                            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 hover:gap-3 transition-all">
                                Continue Shopping <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                            A confirmation email has been sent to your registered address.
                        </p>
                    </div>

                </div>
            </ResponsiveContainer>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
            </div>
        }>
            <OrderSuccessContent />
        </Suspense>
    );
}
