"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { forgotPassword, verifyResetOtp, resetPassword } from "@/lib/api/auth";

type ResetStep = "REQUEST" | "VERIFY" | "RESET";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<ResetStep>("REQUEST");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await forgotPassword(email);
            setStep("VERIFY");
            setMessage("Verification code sent to your email.");
        } catch (err: any) {
            setError(err.message || "Failed to send reset code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await verifyResetOtp(email, otp);
            setResetToken(response.reset_token);
            setStep("RESET");
            setMessage("Identity verified. Set your new password.");
        } catch (err: any) {
            setError(err.message || "Invalid or expired code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await resetPassword(resetToken, newPassword);
            setMessage("Password successfully reset. Redirecting to login...");
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        {step === "REQUEST" && "Reset Password"}
                        {step === "VERIFY" && "Verify Identity"}
                        {step === "RESET" && "New Password"}
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-400">
                        {step === "REQUEST" && "Enter your email to receive a reset code."}
                        {step === "VERIFY" && "Enter the 6-digit code sent to your mail."}
                        {step === "RESET" && "Create a secure new password for your account."}
                    </p>
                </div>

                {message && !error && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">{message}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                        <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">{error}</p>
                    </div>
                )}

                {step === "REQUEST" && (
                    <form className="space-y-6" onSubmit={handleRequestOtp}>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-950 transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email Address"
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-950 transition-all outline-none text-sm"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full py-7 rounded-full bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            loading={isLoading}
                        >
                            Send Reset Code
                        </Button>
                    </form>
                )}

                {step === "VERIFY" && (
                    <form className="space-y-6" onSubmit={handleVerifyOtp}>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-950 transition-colors">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                                placeholder="6-Digit OTP Code"
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-950 transition-all outline-none text-sm tracking-[0.5em] font-black"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full py-7 rounded-full bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            loading={isLoading}
                        >
                            Verify Code
                        </Button>
                        <button
                            type="button"
                            onClick={() => setStep("REQUEST")}
                            className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            Back to Email
                        </button>
                    </form>
                )}

                {step === "RESET" && (
                    <form className="space-y-6" onSubmit={handleResetPassword}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-950 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="New Password"
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-950 transition-all outline-none text-sm"
                                />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-950 transition-colors">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm New Password"
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-950 transition-all outline-none text-sm"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full py-7 rounded-full bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            loading={isLoading}
                        >
                            Reset Password
                        </Button>
                    </form>
                )}

                <div className="mt-12 pt-8 border-t border-slate-50 text-center">
                    <Link href="/login" className="text-sm font-bold text-slate-950 hover:underline underline-offset-4 decoration-2">
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
