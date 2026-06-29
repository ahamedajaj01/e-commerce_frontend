"use client";

import { useState } from "react";
import { getMediaUrl } from "@/lib/utils";
import type { ProductMedia } from "@/types/product";

interface ProductMediaGalleryProps {
    media: ProductMedia[];
    productName: string;
    onMediaSelect?: (mediaId: string) => void;
}

export function ProductMediaGallery({ media, productName, onMediaSelect }: ProductMediaGalleryProps) {
    const [activeImage, setActiveImage] = useState(
        media.length > 0 ? (media[0].file_url || getMediaUrl(media[0].file) || null) : null
    );

    const handleSelect = (url: string, id: string) => {
        setActiveImage(url);
        onMediaSelect?.(id);
    };

    if (!media.length) {
        return (
            <div className="aspect-[3/4] rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">No Image</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4 lg:gap-6">
            {/* Thumbnails */}
            {media.length > 1 && (
                <div className="flex md:flex-col gap-3 overflow-x-auto no-scrollbar md:w-20 lg:w-24 shrink-0">
                    {media.map((item) => {
                        const url = (item.file_url || getMediaUrl(item.file)) ?? "";
                        const isActive = activeImage === url;
                        return (
                            <button
                                key={item.id ?? url}
                                onClick={() => item.id && handleSelect(url, item.id)}
                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0 h-16 w-16 md:h-20 md:w-auto lg:h-24
                  ${isActive ? "border-slate-900 opacity-100 scale-95" : "border-transparent opacity-60 hover:opacity-100"}
                `}
                            >
                                <img
                                    src={url}
                                    alt="Thumbnail"
                                    className="h-full w-full object-cover"
                                />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Main Feature Image */}
            <div className="flex-1 relative aspect-[3/4] lg:aspect-[4/5] rounded-[2rem] overflow-hidden bg-white shadow-2xl shadow-slate-200/50 group border border-slate-100">
                {activeImage && (
                    <img
                        src={activeImage}
                        alt={productName}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                )}
            </div>
        </div>
    );
}
