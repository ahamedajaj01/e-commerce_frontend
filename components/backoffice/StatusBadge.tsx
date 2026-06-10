import { cn } from "@/lib/utils";

type StatusType = "active" | "draft" | "error" | "pending" | "processing" | "delivered" | "shipped" | "low-stock" | "out-of-stock";

interface StatusBadgeProps {
    status: StatusType | string;
    className?: string;
}

const colorMap: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
    draft: "bg-slate-50 text-slate-600 border-slate-100",
    shipped: "bg-blue-50 text-blue-700 border-blue-100",
    processing: "bg-amber-50 text-amber-700 border-amber-100",
    pending: "bg-slate-50 text-slate-500 border-slate-100",
    error: "bg-rose-50 text-rose-700 border-rose-100",
    "low-stock": "bg-orange-50 text-orange-700 border-orange-100",
    "out-of-stock": "bg-rose-50 text-rose-700 border-rose-100",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const s = status.toLowerCase();
    const theme = colorMap[s] || "bg-slate-50 text-slate-500 border-slate-100";

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
            theme,
            className
        )}>
            {status}
        </span>
    );
}
