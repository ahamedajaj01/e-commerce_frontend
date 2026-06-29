"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchOrderDetails } from "@/lib/api/orders";
import { Order } from "@/types/order";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderAddressCard } from "@/components/orders/OrderAddressCard";
import { OrderItemCard } from "@/components/orders/OrderItemCard";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderPricingSummary } from "@/components/orders/OrderPricingSummary";
import { Loader2, ChevronLeft, Calendar, Truck, Fingerprint, Receipt, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function OrderDetailPage() {
    const { uuid } = useParams();
    const { token, isAuthenticated } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !token || !uuid) return;

        const loadDetails = async () => {
            try {
                const data = await fetchOrderDetails(uuid as string, token);
                setOrder(data);
            } catch (err: any) {
                setError(err.message || "Failed to load order details.");
            } finally {
                setIsLoading(false);
            }
        };

        loadDetails();
    }, [uuid, token, isAuthenticated]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Order...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] p-6">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 p-10 text-center space-y-6 shadow-sm">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                        <Fingerprint className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-lg font-bold text-slate-900">Order Not Found</h1>
                        <p className="text-sm font-medium text-slate-500">{error || "The requested order could not be located."}</p>
                    </div>
                    <Link href="/account/orders" border-slate-200 className="block w-full py-4 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest transition-transform active:scale-95">
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f8f8f9] min-h-screen text-slate-900 pb-20">
            <ResponsiveContainer className="py-8 lg:py-12">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Minimal Breadcrumb & Back */}
                    <Link href="/account/orders" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Back to My Orders
                    </Link>

                    {/* Clean Header */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order #{order.order_number}</h1>
                                <OrderStatusBadge status={order.status} />
                            </div>
                            <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Placed on {format(new Date(order.created_at), "MMM d, yyyy")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">
                                <Receipt className="w-3.5 h-3.5" />
                                Invoice
                            </button>
                            <Link href={`/track-order?number=${order.order_number}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                                Track Order
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Order Items */}
                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Shipment Details</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {order.items.map(item => (
                                        <OrderItemCard
                                            key={item.id}
                                            productName={item.product_name}
                                            variantName={item.variant_name}
                                            sku={item.sku}
                                            quantity={item.quantity}
                                            unitPrice={item.unit_price}
                                            lineTotal={item.line_total}
                                            image={item.image}
                                            variant_image={item.variant_image}
                                            thumbnail={item.thumbnail}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Logistics State Chart (Passive) */}
                            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-slate-900" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Delivery Timeline</h3>
                                </div>
                                <OrderTimeline history={order.status_history} />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">

                            {/* Summary Card */}
                            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Payment Summary</h3>
                                <OrderPricingSummary
                                    subtotal={order.subtotal}
                                    shippingFee={order.shipping_fee}
                                    total={order.total_price}
                                />
                                <div className="pt-4 border-t border-slate-50 space-y-2">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Method</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">{order.payment_method_name || "Cash on Delivery"}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${order.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {order.payment_status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Card */}
                            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest">Shipping Address</h3>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">{order.customer_name}</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        {order.shipping_street}, {order.shipping_city}<br />
                                        {order.shipping_district}, {order.shipping_province}
                                    </p>
                                    <p className="text-xs text-slate-400 pt-2">{order.customer_phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ResponsiveContainer>
        </div>
    );
}
