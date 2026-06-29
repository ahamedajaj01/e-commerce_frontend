import { OrderStatusBadge } from "./OrderStatusBadge";
import { Order } from "@/types/order";
import { format } from "date-fns";
import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";

interface OrderCardProps {
    order: Order;
    href: string;
}

export function OrderCard({ order, href }: OrderCardProps) {
    return (
        <Link href={href} className="block group">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:translate-y-[-2px] space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Reference</p>
                            <h3 className="text-lg font-black tracking-tight">{order.order_number}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Finalized On</p>
                            <p className="text-sm font-bold">{format(new Date(order.created_at), "MMM d, yyyy")}</p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Items</p>
                            <p className="text-sm font-black text-slate-600">{order.item_count} {order.item_count === 1 ? 'Product' : 'Products'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Appraisal</p>
                            <p className="text-sm font-black text-slate-900">Rs {order.total_price}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-900 transition-colors">
                        Inspect Order
                        <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
