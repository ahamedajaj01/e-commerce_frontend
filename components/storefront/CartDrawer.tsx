"use client";

import { useCart } from "@/hooks/useCart";
import { getMediaUrl } from "@/lib/utils";
import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertBanner } from "@/components/ui/AlertBanner";

export function CartDrawer() {
    const { isCartOpen, closeCart, items, cart, updateQty, removeItem, isLoading } = useCart();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isCartOpen]);

    const handleUpdateQty = async (itemId: string, newQty: number) => {
        setErrorMsg(null);
        try {
            await updateQty(itemId, newQty);
        } catch (err: any) {
            const msg = err?.message || "";
            const isStockError = msg.toLowerCase().includes("inventory") || msg.toLowerCase().includes("stock");
            setErrorMsg(isStockError ? msg : "Failed to update quantity.");
        }
    };

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={closeCart}
            />

            {/* Drawer Content */}
            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold font-serif text-neutral-900 tracking-tight">
                        Shopping Cart ({items.length})
                    </h2>
                    <button
                        onClick={closeCart}
                        className="p-2 hover:bg-neutral-50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                {/* Minimum Order Hint (from screenshot) */}
                <div className="px-6 py-3 bg-rose-50/30 border-b border-rose-100/20">
                    <p className="text-[10px] uppercase font-black tracking-widest text-rose-500 text-center">
                        Minimum Order Limit <span className="font-bold">Rs 0.00</span>
                    </p>
                </div>

                {errorMsg && (
                    <div className="px-6 pt-4">
                        <AlertBanner message={errorMsg} type="error" onClose={() => setErrorMsg(null)} />
                    </div>
                )}

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-neutral-200" />
                            </div>
                            <p className="text-sm font-medium text-neutral-400">Your bag is empty.</p>
                            <button onClick={closeCart} className="text-xs font-black uppercase tracking-widest text-neutral-900 underline underline-offset-4">
                                Continue Selection
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="group relative flex gap-5 p-5 bg-neutral-50/50 rounded-3xl border border-neutral-100 hover:border-neutral-200 transition-all">
                                {/* Thumbnail */}
                                <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-white border border-neutral-100">
                                    <img
                                        src={getMediaUrl(item.thumbnail)}
                                        alt={item.product_name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-sm font-bold text-neutral-900 leading-none">{item.product_name}</h3>
                                            <p className="text-[10px] text-neutral-400 font-medium mt-1.5 uppercase tracking-wide">
                                                Rs {item.variant.price} × {item.quantity}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-1.5 text-neutral-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        {/* Qty Stepper */}
                                        <div className="flex items-center bg-white border border-neutral-200 rounded-xl px-1 py-1 shadow-sm">
                                            <button
                                                onClick={() => handleUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                                                className="w-7 h-7 flex items-center justify-center font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold text-neutral-900">{item.quantity}</span>
                                            <button
                                                onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Row Total */}
                                        <p className="text-sm font-black text-neutral-900 tracking-tight">
                                            Rs {item.subtotal}
                                        </p>
                                    </div>

                                    {/* Variant Badge Look */}
                                    <div className="flex gap-2 mt-3">
                                        <div className="px-2 py-1 bg-white border border-neutral-100 rounded-md text-[8px] uppercase tracking-widest font-black text-neutral-400">
                                            Colors:<span className="text-neutral-600">{item.variant.color}</span>
                                        </div>
                                        <div className="px-2 py-1 bg-white border border-neutral-100 rounded-md text-[8px] uppercase tracking-widest font-black text-neutral-400">
                                            Size:<span className="text-neutral-600 font-bold">{item.variant.size}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-8 border-t border-neutral-100 bg-white space-y-6">
                        <div className="flex justify-between items-end">
                            <span className="text-xl font-medium font-serif text-neutral-900 tracking-tight">Subtotal</span>
                            <span className="text-2xl font-black text-neutral-900 tracking-tighter">Rs {cart?.total_price}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-medium text-center uppercase tracking-widest italic">
                            Shipping & taxes calculated at checkout
                        </p>
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            className="bg-black text-white w-full py-5 rounded-full text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
                        >
                            Checkout <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
