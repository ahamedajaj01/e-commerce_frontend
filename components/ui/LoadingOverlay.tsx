"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LoadingOverlay() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // When pathname or searchParams change, we hide the loader
        setIsLoading(false);
    }, [pathname, searchParams]);

    // We need a way to trigger the loader on navigation start.
    // In Next.js App Router, this is tricky without wrapping links.
    // However, we can listen for clicks on <a> tags as a heuristic.

    useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");

            if (
                anchor &&
                anchor.href &&
                anchor.href.startsWith(window.location.origin) &&
                !anchor.href.includes("#") &&
                anchor.target !== "_blank" &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.shiftKey &&
                anchor.getAttribute("download") === null
            ) {
                // If it's an internal link, show the loader
                // Only if the path is actually different OR search params are changing
                const url = new URL(anchor.href);
                if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
                    setIsLoading(true);
                }
            }
        };

        document.addEventListener("click", handleAnchorClick);
        return () => document.removeEventListener("click", handleAnchorClick);
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
            <div className="relative">
                <div className="h-16 w-16 rounded-3xl bg-white shadow-2xl flex items-center justify-center border border-slate-100">
                    <Loader2 className="h-8 w-8 text-slate-900 animate-spin" />
                </div>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-slate-900/5 blur-2xl -z-10 rounded-full scale-150" />
            </div>
        </div>
    );
}
