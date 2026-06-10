"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function OrdersPage() {
    const { token, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mock fetch or connect to /api/v1/backoffice/orders
        setTimeout(() => setIsLoading(false), 800);
    }, [token, isAuthenticated]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading Orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-fuchsia-600">Sales Operations</p>
                <h1 className="mt-4 text-4xl font-black text-slate-900 leading-tight">Customer Orders</h1>
                <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
                    Manage fulfillment, cancellations, and customer transactions.
                </p>
            </div>

            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-20 shadow-xl shadow-slate-200/50 text-center">
                <span className="text-5xl grayscale opacity-20">🛒</span>
                <h2 className="mt-6 text-xl font-black text-slate-900">No Orders Processed</h2>
                <p className="mt-4 text-sm text-slate-500 font-medium max-w-xs mx-auto">
                    When customers start checking out from the storefront, their transactions will appear here for management.
                </p>
            </div>
        </div>
    );
}
