import { getMediaUrl } from "@/lib/utils";
import { QrCode, ShieldCheck } from "lucide-react";

interface PaymentInstructionsCardProps {
    methodName: string;
    instructions: string;
    qrImage?: string;
    amount: string;
}

export function PaymentInstructionsCard({
    methodName,
    instructions,
    qrImage,
    amount
}: PaymentInstructionsCardProps) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 pt-10 shadow-sm space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">{methodName} Payment</h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Follow the instructions below to complete your order settlement.</p>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <ShieldCheck className="w-5 h-5" />
                </div>
            </div>

            {/* Body: Left = Instructions + QR | Right = Amount */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                {/* LEFT: Payment instructions + QR code */}
                <div className="md:col-span-7 space-y-6">
                    {/* Instructions */}
                    <div className="text-[13px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                        {instructions}
                    </div>

                    {/* QR Code — big, prominent, below instructions */}
                    {qrImage && (
                        <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100">
                                <img
                                    src={getMediaUrl(qrImage)}
                                    alt="Payment QR Code"
                                    className="w-64 h-64 object-contain rounded-xl"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f8fafc/64748b?text=QR+Coming+Soon';
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <QrCode className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Scan & Pay</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 italic text-center">
                                Open your {methodName} app, scan this QR and enter the exact amount.
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Amount Due */}
                <div className="md:col-span-5">
                    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 space-y-3 sticky top-24">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount Due</p>
                        <p className="text-3xl font-bold tracking-tight text-slate-900">Rs {amount}</p>
                        <div className="pt-3 border-t border-slate-100">
                            <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Secure Transfer
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
