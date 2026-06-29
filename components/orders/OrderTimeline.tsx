import { OrderStatusHistory } from "@/types/order";
import { format } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderTimelineProps {
    history: OrderStatusHistory[];
}

export function OrderTimeline({ history }: OrderTimelineProps) {
    if (!history || history.length === 0) return null;

    return (
        <div className="space-y-10 py-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Lifecycle Timeline</h2>

            <div className="relative space-y-12 pl-8">
                {/* Vertical Line */}
                <div className="absolute left-3.5 top-2 bottom-2 w-[1px] bg-slate-100" />

                {history.map((entry, idx) => (
                    <div key={entry.id} className="relative group animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                        {/* Dot */}
                        <div className="absolute -left-8 top-1 flex items-center justify-center">
                            {idx === 0 ? (
                                <div className="w-7 h-7 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                            ) : (
                                <div className="w-7 h-7 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center">
                                    <Circle className="w-3 h-3 text-slate-200" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <OrderStatusBadge status={entry.status} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    {format(new Date(entry.created_at), "MMM d, yyyy • h:mm a")}
                                </span>
                            </div>

                            {entry.notes && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-xl">
                                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                                        "{entry.notes}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
