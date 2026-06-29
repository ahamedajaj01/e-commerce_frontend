interface OrderPricingSummaryProps {
    subtotal: string;
    shippingFee: string;
    total: string;
    className?: string;
}

export function OrderPricingSummary({ subtotal, shippingFee, total, className }: OrderPricingSummaryProps) {
    return (
        <div className={className}>
            <div className="space-y-4 pt-4">
                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Merchandise Total</span>
                    <span className="text-slate-900">Rs {subtotal}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Shipping & Handling</span>
                    <span className="text-slate-900">Rs {shippingFee}</span>
                </div>
                <div className="pt-8 border-t border-slate-50 flex justify-between items-center text-slate-900">
                    <span className="text-sm font-black uppercase tracking-widest">Total Valuation</span>
                    <span className="text-2xl font-black tracking-tighter">Rs {total}</span>
                </div>
            </div>
        </div>
    );
}
