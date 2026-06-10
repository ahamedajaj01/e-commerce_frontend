"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { getMediaUrl } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function HeroSlider({ campaigns }: { campaigns: any[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const scrollNext = () => {
        if (scrollRef.current) {
            const newIndex = (currentIndex + 1) % campaigns.length;
            scrollRef.current.scrollTo({ left: scrollRef.current.clientWidth * newIndex, behavior: 'smooth' });
        }
    };

    const scrollPrev = () => {
        if (scrollRef.current) {
            const newIndex = currentIndex === 0 ? campaigns.length - 1 : currentIndex - 1;
            scrollRef.current.scrollTo({ left: scrollRef.current.clientWidth * newIndex, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
                setCurrentIndex(index);
            }
        };
        const el = scrollRef.current;
        if (el) el.addEventListener('scroll', handleScroll);
        return () => { if (el) el.removeEventListener('scroll', handleScroll); }
    }, []);

    if (!campaigns || campaigns.length === 0) return null;

    return (
        <section className="relative min-h-[50vh] sm:min-h-[60vh] lg:h-[85vh] overflow-hidden bg-slate-950 group">

            {/* Slider Container */}
            <div
                ref={scrollRef}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth z-0 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
                {campaigns.map((promo, idx) => (
                    <div key={promo.id || idx} className="flex-none w-full h-full snap-start relative flex items-end sm:items-center overflow-hidden">
                        <img
                            src={getMediaUrl(promo.image)}
                            alt={promo.title || ""}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[10s] hover:scale-110 pointer-events-none"
                        />
                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent sm:bg-gradient-to-r sm:from-black/70 sm:via-black/20 sm:to-transparent pointer-events-none z-10" />

                        {/* Content area */}
                        <div className="relative z-20 mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-12 pb-10 sm:pb-0 pointer-events-auto">
                            <div className="max-w-2xl space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000">
                                <h1 className="text-3xl sm:text-5xl lg:text-8xl font-black tracking-tighter text-white leading-[0.95]">
                                    {promo.title || "Elite Collections"}
                                </h1>
                                {promo.description && (
                                    <p className="text-sm sm:text-base md:text-lg text-slate-200/80 max-w-lg leading-relaxed font-medium">
                                        {promo.description}
                                    </p>
                                )}
                                {promo.cta_link && (
                                    <div className="pt-2 sm:pt-4">
                                        <Link href={promo.cta_link} className="inline-flex items-center gap-3 sm:gap-4 bg-white text-black px-8 sm:px-12 py-4 sm:py-6 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all duration-300">
                                            {promo.cta_text || "Shop Now"}
                                            <span className="text-base sm:text-lg">→</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Slider Controls */}
            {campaigns.length > 1 && (
                <div className="absolute inset-x-0 bottom-4 sm:bottom-0 sm:top-1/2 sm:-translate-y-1/2 h-14 flex items-center justify-center sm:justify-between px-6 lg:px-12 z-30 pointer-events-none">

                    <button onClick={scrollPrev} className="pointer-events-auto hidden sm:flex items-center justify-center p-3 sm:p-5 rounded-full bg-white/10 hover:bg-white border border-white/20 hover:border-white text-white hover:text-black backdrop-blur-md transition shadow-2xl opacity-0 hover:opacity-100 sm:opacity-50 sm:group-hover:opacity-100">
                        <ChevronLeft className="w-5 h-5 sm:w-8 sm:h-8" />
                    </button>

                    {/* Dots on mobile / center */}
                    <div className="flex gap-2 items-center justify-center pointer-events-auto self-end sm:self-auto sm:opacity-50 group-hover:opacity-100 transition-opacity absolute bottom-0 left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 pb-6 sm:pb-0">
                        {campaigns.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (scrollRef.current) scrollRef.current.scrollTo({ left: scrollRef.current.clientWidth * idx, behavior: 'smooth' });
                                }}
                                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${currentIndex === idx ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}`}
                            />
                        ))}
                    </div>

                    <button onClick={scrollNext} className="pointer-events-auto hidden sm:flex items-center justify-center p-3 sm:p-5 rounded-full bg-white/10 hover:bg-white border border-white/20 hover:border-white text-white hover:text-black backdrop-blur-md transition shadow-2xl opacity-0 hover:opacity-100 sm:opacity-50 sm:group-hover:opacity-100">
                        <ChevronRight className="w-5 h-5 sm:w-8 sm:h-8" />
                    </button>
                </div>
            )}

        </section>
    );
}
