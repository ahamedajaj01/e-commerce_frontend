"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Lock, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { changePassword } from "@/lib/api/auth";

export default function SecuritySettingsPage() {
    const { token, logout } = useAuth();
    const router = useRouter();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            await changePassword(token, oldPassword, newPassword);
            setSuccess("Password updated successfully. Please sign in again.");
            setTimeout(() => {
                logout();
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to update password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
            <button
                onClick={() => router.back()}
                className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Profile
            </button>

            <div className="mb-12">
                <h1 className="text-3xl font-bold text-slate-900">Security Settings</h1>
                <p className="mt-2 text-slate-500">Manage your account password and security preferences</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <form className="space-y-6" onSubmit={handlePasswordChange}>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Current Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 transition-colors group-focus-within:text-slate-950">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 focus:ring-2 focus:ring-slate-950 outline-none text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 transition-colors group-focus-within:text-slate-950">
                                    <KeyRound className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 focus:ring-2 focus:ring-slate-950 outline-none text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 transition-colors group-focus-within:text-slate-950">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 focus:ring-2 focus:ring-slate-950 outline-none text-sm transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{success}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full py-7 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-100"
                        loading={isSubmitting}
                    >
                        Update Password
                    </Button>
                </form>
            </div>
        </div>
    );
}
