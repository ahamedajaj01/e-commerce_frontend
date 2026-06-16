"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "primary" | "success";
    onConfirm: () => Promise<void> | void;
}

interface ModalContextType {
    confirm: (options: ConfirmOptions) => void;
    close: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setTimeout(() => {
            setOptions(null);
            setIsConfirming(false);
        }, 200);
    }, []);

    const handleConfirm = async () => {
        if (!options) return;
        setIsConfirming(true);
        try {
            await options.onConfirm();
            close();
        } catch (error) {
            console.error("[Modal] Confirmation action failed:", error);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <ModalContext.Provider value={{ confirm, close }}>
            {children}

            {/* Confirmation Modal */}
            {isOpen && options && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={close}
                    />

                    <div className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                        {/* Header / Icon */}
                        <div className="px-6 pt-8 pb-4 text-center">
                            <div className={cn(
                                "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform scale-110",
                                options.variant === "danger" ? "bg-rose-50 text-rose-600" :
                                    options.variant === "success" ? "bg-emerald-50 text-emerald-600" :
                                        "bg-slate-50 text-slate-600"
                            )}>
                                {options.variant === "danger" ? <AlertTriangle className="w-6 h-6" /> :
                                    options.variant === "success" ? <ShieldCheck className="w-6 h-6" /> :
                                        <HelpCircle className="w-6 h-6" />}
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                {options.title}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed px-4">
                                {options.description}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-8 pt-4 flex flex-col sm:flex-row gap-2">
                            <Button
                                variant="secondary"
                                onClick={close}
                                className="flex-1 order-2 sm:order-1"
                                disabled={isConfirming}
                            >
                                {options.cancelText || "Cancel"}
                            </Button>
                            <Button
                                variant={options.variant === "danger" ? "danger" : "primary"}
                                onClick={handleConfirm}
                                loading={isConfirming}
                                className="flex-1 order-1 sm:order-2"
                            >
                                {options.confirmText || "Confirm"}
                            </Button>
                        </div>

                        {/* Optional Close X */}
                        <button
                            onClick={close}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            disabled={isConfirming}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
}
