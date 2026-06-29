import { PaymentStatus } from "@/types/payment";
import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
    status: PaymentStatus;
    className?: string;
}

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
    PENDING: {
        label: "Pending",
        className: "bg-amber-50 text-amber-600 border-amber-100",
    },
    SUBMITTED: {
        label: "Submitted",
        className: "bg-blue-50 text-blue-600 border-blue-100",
    },
    APPROVED: {
        label: "Approved",
        className: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    REJECTED: {
        label: "Rejected",
        className: "bg-rose-50 text-rose-600 border-rose-100",
    },
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.PENDING;

    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            config.className,
            className
        )}>
            {config.label}
        </span>
    );
}
