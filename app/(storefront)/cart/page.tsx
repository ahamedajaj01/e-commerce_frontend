"use client";

import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { getMediaUrl } from "@/lib/utils";
import { useState } from "react";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const { cart, items, updateQty, removeItem, isLoading, isGuest } = useCart();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    setErrorMsg(null);
    try {
      await updateQty(itemId, newQty);
    } catch (err: any) {
      const msg = err?.message || "";
      const isStockError = err?.code === "INSUFFICIENT_STOCK" ||
        err?.code === "INSUFFICIENTSTOCKEXCEPTION" ||
        msg.toLowerCase().includes("inventory") ||
        msg.toLowerCase().includes("stock");

      if (isStockError) {
        setErrorMsg(msg || "Sorry, we don't have enough stock for this item.");
      } else if (msg && msg !== "Bad Request" && msg !== "API request failed") {
        setErrorMsg(msg);
      } else {
        setErrorMsg("Failed to update item quantity. Please try again.");
      }
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setErrorMsg(null);
    try {
      await removeItem(itemId);
    } catch (err: any) {
      if (err?.message && err.message !== "Bad Request" && err.message !== "API request failed") {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to remove item. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <ResponsiveContainer className="py-32 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Restoring your bag...</p>
      </ResponsiveContainer>
    );
  }

  if (items.length === 0) {
    return (
      <ResponsiveContainer className="py-24 sm:py-32 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight">Your bag is empty</h1>
          <p className="text-xs sm:text-base text-slate-500 font-medium">Capture your fashion discoveries and they will appear here.</p>
        </div>
        <Link href="/products" className="inline-block rounded-2xl bg-slate-900 px-8 py-4 sm:px-10 sm:py-5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all">
          Explore Collection &rarr;
        </Link>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <ResponsiveContainer className="py-12 sm:py-20">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="space-y-6 border-b border-neutral-100 pb-8">
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-neutral-900 tracking-tight">
              Shopping Cart ({items.length})
            </h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-rose-500">
              Minimum Order Limit <span className="font-bold">Rs 0.00</span>
            </p>
          </div>

          {errorMsg && (
            <AlertBanner
              message={errorMsg}
              type="error"
              onClose={() => setErrorMsg(null)}
            />
          )}

          {/* Product Cards */}
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="group relative flex flex-col sm:flex-row sm:items-center gap-6 p-6 sm:p-8 rounded-[2rem] border border-neutral-100 bg-neutral-50/30 hover:shadow-xl hover:shadow-neutral-200/40 hover:border-neutral-200 transition-all duration-500">
                <div className="flex gap-6 w-full">
                  {/* Thumbnail */}
                  <div className="h-28 w-24 sm:h-36 sm:w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-white border border-neutral-100 relative shadow-sm">
                    <img
                      src={getMediaUrl(item.selected_image_url)}
                      alt={item.product_name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  {/* Details Container */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-xl font-bold text-neutral-900 tracking-tight leading-none">
                          {item.product_name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-neutral-400 font-medium">
                          Rs {item.variant.price} × {item.quantity}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-neutral-300 hover:text-rose-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Custom Stepper */}
                      <div className="flex items-center bg-white border border-neutral-200 rounded-xl px-2 py-1.5 shadow-sm">
                        <button
                          onClick={() => handleUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-black text-neutral-900">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center font-bold text-neutral-400 hover:text-neutral-900 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Total for Row */}
                      <p className="text-lg font-black text-neutral-900 tracking-tighter">
                        Rs {item.subtotal}
                      </p>
                    </div>

                    {/* Variant Badges */}
                    <div className="flex gap-2 mt-4">
                      <div className="px-3 py-1.5 bg-white border border-neutral-100 rounded-lg text-[9px] uppercase tracking-widest font-black text-neutral-400">
                        Size:<span className="text-neutral-800 font-bold ml-1">{item.variant.size}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Summary */}
          <div className="pt-12 border-t border-neutral-100 space-y-8">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-medium font-serif text-neutral-900 tracking-tight">Subtotal</span>
              <span className="text-3xl font-black text-neutral-900 tracking-tighter">Rs {cart?.total_price}</span>
            </div>

            <p className="text-[11px] text-neutral-400 font-medium text-center uppercase tracking-[0.15em] italic">
              Shipping & taxes calculated at checkout
            </p>

            <div className="space-y-4 pt-4">
              <Link
                href="/checkout"
                className="w-full py-6 rounded-full bg-black text-white text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
              >
                Checkout Now
              </Link>
              <Link href="/products" className="block text-center text-[10px] uppercase font-black tracking-widest text-neutral-300 hover:text-neutral-900 transition-colors">
                &larr; Return to Gallery
              </Link>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
