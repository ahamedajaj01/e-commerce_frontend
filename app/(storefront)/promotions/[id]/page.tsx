"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchStorefrontPromotion } from "@/lib/api/cms";
import type { Promotion } from "@/types/cms";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ArrowLeft, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PromotionDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [promotion, setPromotion] = useState<Promotion | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetchStorefrontPromotion(id as string)
            .then(setPromotion)
            .catch(() => router.push("/"))
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
        );
    }

    if (!promotion) return null;

    return (
        <main className="min-h-screen bg-white">
            {/* Zero Header Product Gallery */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 py-12">
                {(!promotion.products || promotion.products.length === 0) ? (
                    <div className="py-20 text-center">
                        <p className="text-neutral-200 text-[10px] font-bold uppercase tracking-widest italic">Gallery Pending Selection</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-y-16">
                        {promotion.products.map((product, idx) => (
                            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${idx * 40}ms` }}>
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
