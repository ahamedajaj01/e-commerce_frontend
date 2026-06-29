import { PaymentMethod } from "@/types/payment";
import { CheckCircle2, CreditCard, Landmark, Wallet, Smartphone, QrCode, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethodCardProps {
    method: PaymentMethod;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

const iconMap: Record<string, any> = {
    "BANK": Landmark,
    "WALLET": Smartphone,
    "QR": QrCode,
    "CONNECT_IPS": Link2,
    "DEFAULT": CreditCard
};

export function PaymentMethodCard({ method, isSelected, onSelect }: PaymentMethodCardProps) {
    // Try to get icon from method.type (sent from backoffice categorization)
    const Icon = iconMap[method.type?.toUpperCase() || ""] || iconMap.DEFAULT;

    return (
        <button
            onClick={() => onSelect(method.id)}
            className={cn(
                "w-full p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group",
                isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200"
                    : "bg-white border-slate-200 text-slate-900 hover:border-slate-800"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isSelected ? "bg-white/10" : "bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white"
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <h3 className="text-[13px] font-bold tracking-tight leading-none">{method.name}</h3>
                    {method.description && (
                        <p className={cn(
                            "text-[10px] font-medium mt-1.5",
                            isSelected ? "text-white/50" : "text-slate-400"
                        )}>
                            {method.description}
                        </p>
                    )}
                </div>
            </div>

            <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                isSelected ? "border-white bg-white" : "border-slate-200"
            )}>
                {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                )}
            </div>
        </button>
    );
}
