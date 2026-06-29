"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Package, LogOut, MapPin, MessageSquare, ChevronRight, User, Lock } from "lucide-react";

export default function ProfilePage() {
    const { user, logout, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (user?.is_staff || user?.role === "admin") {
                router.push("/backoffice/dashboard");
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-slate-900">My Account</h1>
                <p className="mt-2 text-slate-500">Manage your orders and account settings</p>
            </div>

            <div className="space-y-4">
                {/* Profile Header (Simple) */}
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 mb-8">
                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900">{user?.name}</h2>
                        <p className="text-sm text-slate-500">{user?.email}</p>
                    </div>
                </div>

                {/* Navigation Options */}
                <div className="grid gap-3">
                    <button
                        onClick={() => router.push("/account/orders")}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left transition hover:border-slate-200 hover:bg-slate-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">My Orders</h3>
                                <p className="text-xs text-slate-500">Track and view your order history</p>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>

                    <button className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left transition hover:border-slate-200 hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Saved Addresses</h3>
                                <p className="text-xs text-slate-500">Manage your delivery locations</p>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>

                    <button
                        onClick={() => router.push("/profile/security")}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left transition hover:border-slate-200 hover:bg-slate-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Security Settings</h3>
                                <p className="text-xs text-slate-500">Update password and manage account security</p>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>

                    <button className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left transition hover:border-slate-200 hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Support & Complaints</h3>
                                <p className="text-xs text-slate-500">Get help with your shopping experience</p>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                </div>

                <div className="pt-8 flex flex-col items-center">
                    <button
                        onClick={() => { logout(); router.push("/"); }}
                        className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 transition"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                    </button>
                    <p className="mt-4 text-[10px] uppercase tracking-widest text-slate-300 font-bold">Lyra Label v1.0</p>
                </div>
            </div>
        </div>
    );
}
