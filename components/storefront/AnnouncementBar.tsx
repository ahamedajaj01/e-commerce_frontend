"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAnnouncements } from "@/lib/api/cms";
import type { Announcement } from "@/types/cms";

export function AnnouncementBar() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        fetchAnnouncements()
            .then(data => {
                const visible = data.filter(a => a.is_visible).sort((a, b) => a.sort_order - b.sort_order);
                setAnnouncements(visible);
            })
            .catch(() => setAnnouncements([]));
    }, []);

    useEffect(() => {
        if (announcements.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [announcements]);

    if (announcements.length === 0) return null;

    const current = announcements[currentIndex];

    // Helper to resolve the correct URL
    const getHref = (item: Announcement) => {
        if (item.linked_product) return `/products/${item.linked_product.id}`;
        if (item.linked_promotion) return `/promotions/${item.linked_promotion.id}`;
        return item.redirect_url || "#";
    };

    const finalHref = getHref(current);

    return (
        <div className="bg-slate-950 text-white overflow-hidden relative border-b border-white/5 cursor-pointer hover:bg-slate-900 transition-colors group">
            <Link href={finalHref} className="mx-auto max-w-7xl flex items-center justify-center min-h-[34px] sm:min-h-[40px] px-4">
                <div
                    key={current.id}
                    className="animate-in fade-in slide-in-from-top-1 duration-700 flex items-center justify-center gap-3 sm:gap-4 w-full"
                >
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-center">
                        {current.title}
                    </span>
                    {current.cta_text && (
                        <span className="hidden sm:inline-block bg-white text-slate-950 px-2.5 py-1 rounded-full text-[9px] font-black hover:bg-slate-100 transition-colors uppercase tracking-tight">
                            {current.cta_text}
                        </span>
                    )}
                </div>
            </Link>

            {announcements.length > 1 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2 opacity-20">
                    <span className="text-[9px] font-bold">{currentIndex + 1} / {announcements.length}</span>
                </div>
            )}
        </div>
    );
}
