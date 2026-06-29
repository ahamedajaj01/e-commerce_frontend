import { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
    status: OrderStatus;
    className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
    PENDING: {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border-amber-100",
    },
    CONFIRMED: {
        label: "Confirmed",
        className: "bg-blue-50 text-blue-700 border-blue-100",
    },
    PROCESSING: {
        label: "Processing",
        className: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    READY_TO_DISPATCH: {
        label: "Ready to Dispatch",
        className: "bg-cyan-50 text-cyan-700 border-cyan-100",
    },
    DISPATCHED: {
        label: "Dispatched",
        className: "bg-sky-50 text-sky-700 border-sky-100",
    },
    SHIPPED: {
        label: "Shipped",
        className: "bg-purple-50 text-purple-700 border-purple-100",
    },
    DELIVERED: {
        label: "Delivered",
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-slate-100 text-slate-500 border-slate-200",
    },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
    const config = statusConfig[status] || { label: status, className: "bg-slate-50 text-slate-400 border-slate-100" };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap",
            config.className,
            className
        )}>
            {config.label}
        </span>
    );
}
