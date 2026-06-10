import React from "react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
    message: string;
    type?: "error" | "success" | "warning" | "info";
    onClose?: () => void;
    className?: string;
}

export function AlertBanner({
    message,
    type = "error",
    onClose,
    className,
}: AlertBannerProps) {
    if (!message) return null;

    return (
        <div
            className={cn(
                "flex items-center justify-between p-4 mb-6 text-sm font-semibold rounded-2xl border transition-all animate-in fade-in slide-in-from-top-2",
                {
                    "bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100": type === "error",
                    "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100": type === "success",
                    "bg-amber-50 text-amber-800 border-amber-200 shadow-amber-100": type === "warning",
                    "bg-blue-50 text-blue-800 border-blue-200 shadow-blue-100": type === "info",
                },
                className
            )}
            role="alert"
        >
            <div className="flex items-center gap-3">
                {type === "error" && <span className="text-lg">❌</span>}
                {type === "success" && <span className="text-lg">✅</span>}
                {type === "warning" && <span className="text-lg">⚠️</span>}
                {type === "info" && <span className="text-lg">ℹ️</span>}
                <p className="tracking-tight">{message}</p>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    type="button"
                    className="ml-auto inline-flex items-center justify-center p-1.5 opacity-50 hover:opacity-100 hover:bg-black/5 rounded-lg transition-all"
                    aria-label="Close"
                >
                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            )}
        </div>
    );
}
