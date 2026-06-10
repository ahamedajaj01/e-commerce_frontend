"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { sendOtp, verifyOtp, completeSignup } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type SignupStep = "REQUEST_OTP" | "VERIFY_OTP" | "COMPLETE_SIGNUP";

import { Mail, ShieldCheck, Lock, ArrowRight, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("REQUEST_OTP");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await sendOtp(email);
      setStep("VERIFY_OTP");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { signup_token } = await verifyOtp(email, otp);
      setSignupToken(signup_token);
      setStep("COMPLETE_SIGNUP");
    } catch (err: any) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await completeSignup(signupToken, password);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            {step === "REQUEST_OTP" && <Mail className="h-5 w-5" />}
            {step === "VERIFY_OTP" && <ShieldCheck className="h-5 w-5" />}
            {step === "COMPLETE_SIGNUP" && <Lock className="h-5 w-5" />}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {step === "REQUEST_OTP" && "Join Lyra Label"}
            {step === "VERIFY_OTP" && "Verify Email"}
            {step === "COMPLETE_SIGNUP" && "Security Setup"}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-400">
            {step === "REQUEST_OTP" && "Create your fashion enthusiast account."}
            {step === "VERIFY_OTP" && `Code sent to ${email}`}
            {step === "COMPLETE_SIGNUP" && "Set your secure access password."}
          </p>
        </div>

        {step === "REQUEST_OTP" && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
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
            {error && <p className="text-xs font-bold text-red-500 uppercase tracking-wider text-center">{error}</p>}
            <Button type="submit" className="w-full py-7 rounded-full bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group" disabled={isLoading}>
              {isLoading ? "Sending..." : (
                <span className="flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>
        )}

        {step === "VERIFY_OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-black text-2xl py-5 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-200 focus:ring-2 focus:ring-inset focus:ring-slate-950 transition-all outline-none"
              />
            </div>
            {error && <p className="text-xs font-bold text-red-500 uppercase tracking-wider text-center">{error}</p>}
            <Button type="submit" className="w-full py-7 rounded-full bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("REQUEST_OTP")}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-3 w-3" /> Change Email
            </button>
          </form>
        )}

        {step === "COMPLETE_SIGNUP" && (
          <form onSubmit={handleCompleteSignup} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-950 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Secure Password"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-950 transition-all outline-none text-sm"
              />
            </div>
            {error && <p className="text-xs font-bold text-red-500 uppercase tracking-wider text-center">{error}</p>}
            <Button type="submit" className="w-full py-7 rounded-full bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group" disabled={isLoading}>
              {isLoading ? "Creating..." : (
                <span className="flex items-center gap-2">
                  Complete Signup <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-sm font-medium text-slate-500">
            Already a member?{" "}
            <Link href="/login" className="text-slate-950 font-bold hover:underline underline-offset-4 decoration-2">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

