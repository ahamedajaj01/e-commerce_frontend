"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAnnouncements } from "@/lib/api/cms";
import type { Announcement } from "@/types/cms";
import { getMediaUrl } from "@/lib/utils";
import { X, ExternalLink, Zap } from "lucide-react";

export function BroadcastCenter() {
    const [popup, setPopup] = useState<Announcement | null>(null);
    const [floater, setFloater] = useState<Announcement | null>(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        fetchAnnouncements()
            .then(data => {
                const visible = data.filter(a => a.is_visible);

                // Find first active popup
                const activePopup = visible.find(a => a.title.includes("[POPUP]"));
                if (activePopup) {
                    setPopup(activePopup);
                    // Show popup if not dismissed in this session
                    const isDismissed = sessionStorage.getItem(`dismissed_popup_${activePopup.id}`);
                    if (!isDismissed) {
                        setTimeout(() => setShowPopup(true), 1500); // Wait 1.5s for mood setting
                    }
                }

                // Find first active floater
                const activeFloater = visible.find(a => a.title.includes("[FLOATER]"));
                if (activeFloater) {
                    setFloater(activeFloater);
                }
            })
            .catch(() => { });
    }, []);

    const dismissPopup = () => {
        if (popup) {
            sessionStorage.setItem(`dismissed_popup_${popup.id}`, "true");
        }
        setShowPopup(false);
    };

    const getHref = (item: Announcement) => {
        if (item.linked_promotion) return `/promotions/${item.linked_promotion.slug || item.linked_promotion.id}`;
        if (item.linked_product) return `/products/${item.linked_product.id}`;
        return item.redirect_url || "#";
    };

    return (
        <>
            {/* 1. HERO POPUP MODAL */}
            {showPopup && popup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={dismissPopup} />
                    <div className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-700">
                        <button
                            onClick={dismissPopup}
                            className="absolute top-6 right-6 z-10 p-2 bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-slate-950 rounded-full transition-all border border-white/20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <Link href={getHref(popup)} onClick={dismissPopup} className="block group">
                            <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                                {(popup as any).image ? (
                                    <img
                                        src={getMediaUrl((popup as any).image)}
                                        alt="Promotion"
                                        className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white p-12 text-center">
                                        <h3 className="text-3xl font-black uppercase tracking-tight">{popup.title.replace(/\[POPUP\] /, "")}</h3>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                <div className="absolute bottom-10 left-10 right-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/20 rounded">Exclusive Blast</span>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                                        {popup.title.replace(/\[POPUP\] /, "")}
                                    </h3>
                                    <div className="mt-8 flex items-center justify-between">
                                        <span className="text-xs font-black text-white uppercase tracking-widest border-b-2 border-white pb-1 group-hover:pr-4 transition-all">
                                            {popup.cta_text || "Explore Now"}
                                        </span>
                                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-950">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {/* 2. CORNER FLOATER */}
            {floater && (
                <div className="fixed bottom-6 left-6 z-[90] animate-in slide-in-from-left-8 duration-1000 hidden md:block">
                    <Link
                        href={getHref(floater)}
                        className="flex items-center gap-4 bg-white/95 backdrop-blur-sm p-4 rounded-[2rem] border border-slate-200 shadow-xl hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                            {(floater as any).image ? (
                                <img src={getMediaUrl((floater as any).image)} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                                    <Zap className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        <div className="pr-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Don't Miss</p>
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-fuchsia-600 transition-colors">
                                {floater.title.replace(/\[FLOATER\] /, "")}
                            </h4>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>
                </div>
            )}
        </>
    );
}

function ArrowRight(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    )
}
