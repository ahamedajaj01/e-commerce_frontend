"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertBanner } from "@/components/ui/AlertBanner";

interface AddToCartButtonProps {
    variants: ProductVariant[];
}

export function AddToCartButton({ variants }: AddToCartButtonProps) {
    const { addItem, isLoading } = useCart();
    const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || "");
    const [adding, setAdding] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    const selectedVariant = variants.find((v) => v.id === selectedVariantId);

    // Derived states
    const selectedColor = selectedVariant?.color || "";
    const selectedSize = selectedVariant?.size || "";

    // 1. Get ALL possible colors and sizes across the whole product
    const allColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
    const allSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));

    // 2. Helper to find exact variant
    const getExactVariant = (color: string, size: string) => {
        return variants.find(v => v.color === color && v.size === size);
    };

    const handleColorChange = (color: string) => {
        setQuantity(1); // reset qty on variant switch
        setErrorMsg(null);
        const matchingSize = getExactVariant(color, selectedSize);
        if (matchingSize) {
            setSelectedVariantId(matchingSize.id);
        } else {
            const firstOfColor = variants.find(v => v.color === color);
            if (firstOfColor) setSelectedVariantId(firstOfColor.id);
        }
    };

    const handleSizeChange = (size: string) => {
        setQuantity(1); // reset qty on variant switch
        setErrorMsg(null);
        const matchingColor = getExactVariant(selectedColor, size);
        if (matchingColor) {
            setSelectedVariantId(matchingColor.id);
        } else {
            const firstOfSize = variants.find(v => v.size === size);
            if (firstOfSize) setSelectedVariantId(firstOfSize.id);
        }
    };

    // UI state
    const stockQty = selectedVariant?.stock_quantity ?? selectedVariant?.available_quantity ?? 0;
    const isUnlimited = selectedVariant?.is_unlimited_stock ?? false;
    const canPurchase = selectedVariant ? stockQty > 0 || isUnlimited : false;
    const atMaxQty = !isUnlimited && quantity >= stockQty;

    const handleAdd = async () => {
        if (!selectedVariantId || !canPurchase) return;
        setAdding(true);
        setErrorMsg(null);
        try {
            const qty = isUnlimited ? quantity : Math.min(quantity, stockQty);
            await addItem(selectedVariantId, qty);
        } catch (err: any) {
            if (err?.code === "INSUFFICIENT_STOCK" || err?.code === "INSUFFICIENTSTOCKEXCEPTION") {
                setErrorMsg(err?.message || "Sorry, not enough stock available for that quantity.");
            } else if (err?.code === "VARIANT_NOT_AVAILABLE") {
                setErrorMsg("Sorry, that variant is no longer available.");
            } else if (err?.message && err.message !== "Bad Request" && err.message !== "API request failed") {
                setErrorMsg(err.message);
            } else {
                setErrorMsg("Failed to add to cart. Please try again.");
            }
        } finally {
            setAdding(false);
        }
    };

    if (variants.length === 0) {
        return (
            <div className="py-4 px-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 font-bold uppercase tracking-widest text-[10px]">
                Currently Out of Stock
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {errorMsg && (
                <AlertBanner
                    message={errorMsg}
                    type="error"
                    onClose={() => setErrorMsg(null)}
                    className="mb-0"
                />
            )}
            {/* Color selection */}
            {allColors.length > 0 && (
                <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Color</label>
                    <div className="flex flex-wrap gap-3">
                        {allColors.map((color) => {
                            const isSelected = selectedColor === color;
                            // Check if this color exists in ANY size
                            const exists = variants.some(v => v.color === color);
                            if (!exists) return null;

                            return (
                                <button
                                    key={color}
                                    onClick={() => handleColorChange(color as string)}
                                    className={`px-6 py-2.5 rounded-full text-[11px] font-bold border transition-all duration-300
                                        ${isSelected
                                            ? "bg-slate-950 border-slate-950 text-white shadow-lg shadow-slate-200"
                                            : "bg-white border-slate-200 text-slate-900 hover:border-slate-400"}
                                    `}
                                >
                                    {color}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Size selection */}
            {allSizes.length > 0 && (
                <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Size</label>
                    <div className="flex flex-wrap gap-3">
                        {allSizes.map((size) => {
                            // Find the variant for THIS size and CURRENTLY selected color
                            const v = getExactVariant(selectedColor, size as string);
                            const isSelected = selectedSize === size;

                            // A size is "available" to select IF it exists for the current color
                            // (even if stock is 0, we allow selection to show "Sold Out")
                            const existsForColor = !!v;
                            const hasStock = v ? (v.stock_quantity > 0 || v.is_unlimited_stock) : false;

                            return (
                                <button
                                    key={size}
                                    disabled={!existsForColor}
                                    onClick={() => handleSizeChange(size as string)}
                                    className={`h-11 min-w-[2.75rem] px-3 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-300
                                        ${isSelected
                                            ? "bg-slate-950 border-slate-950 text-white shadow-lg shadow-slate-200"
                                            : existsForColor
                                                ? hasStock
                                                    ? "bg-white border-slate-200 text-slate-900 hover:border-slate-400"
                                                    : "bg-white border-slate-200 text-slate-300 line-through"
                                                : "bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed opacity-30"}
                                    `}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-full px-5 py-3 shadow-sm shrink-0">
                        <button
                            type="button"
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            className={`transition ${quantity <= 1 ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-slate-900"}`}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-black w-4 text-center">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity(q => q + 1)}
                            disabled={atMaxQty}
                            className={`transition ${atMaxQty ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-slate-900"}`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <Button
                        onClick={handleAdd}
                        disabled={adding || isLoading}
                        className="flex-1 py-4 sm:py-5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 active:scale-[0.98] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {adding ? "Adding..." : "Add to Bag"}
                    </Button>
                </div>
            </div>
            {/* Max stock warning */}
            {canPurchase && atMaxQty && (
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 animate-in fade-in duration-200">
                    ✦ Only {stockQty} in stock — maximum quantity reached
                </p>
            )}

            {/* Main Action Button - Buy Now */}
            {canPurchase ? (
                <Button
                    onClick={async () => {
                        // Quick Add
                        if (!selectedVariantId || !canPurchase) return;
                        setAdding(true);
                        setErrorMsg(null);
                        try {
                            const qty = isUnlimited ? quantity : Math.min(quantity, stockQty);
                            await addItem(selectedVariantId, qty);
                            router.push("/cart");
                        } catch (err: any) {
                            if (err?.code === "INSUFFICIENT_STOCK" || err?.code === "INSUFFICIENTSTOCKEXCEPTION") {
                                setErrorMsg(err?.message || "Sorry, not enough stock available for that quantity.");
                            } else if (err?.code === "VARIANT_NOT_AVAILABLE") {
                                setErrorMsg("Sorry, that variant is no longer available.");
                            } else if (err?.message && err.message !== "Bad Request" && err.message !== "API request failed") {
                                setErrorMsg(err.message);
                            } else {
                                setErrorMsg("Checkout failed. Please try again.");
                            }
                        } finally {
                            setAdding(false);
                        }
                    }}
                    disabled={adding || isLoading}
                    className="w-full py-5 sm:py-6 rounded-full bg-slate-950 text-white flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-950/20 active:scale-[0.98] transition-transform"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Buy It Now
                </Button>
            ) : (
                <button disabled className="w-full py-5 rounded-full bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-[11px] cursor-not-allowed">
                    Sold Out
                </button>
            )}
        </div>
    );
}

