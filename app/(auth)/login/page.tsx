"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, ArrowRight } from "lucide-react";
import type { UserProfile } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeForRole = (user: UserProfile) => {
    const roles = user.roles || [];
    if (!user.is_staff) return "/";
    if (roles.includes("inventory")) return "/backoffice/inventory";
    if (roles.includes("marketing")) return "/backoffice/cms";
    return "/backoffice/dashboard";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      router.push(routeForRole(user));
    } catch (error) {
      setError((error as Error).message || "Invalid credentials. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Welcome Back</h1>
          <p className="mt-2 text-sm font-medium text-slate-400">Access your personalized fashion hub.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-950 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border-0 rounded-2xl text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-950 transition-all outline-none text-sm"
              />
            </div>

            <div className="flex justify-end px-1">
              <Link
                href="/forgot-password"
                className="text-[11px] font-bold text-slate-400 hover:text-slate-950 transition-colors uppercase tracking-widest"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-7 rounded-full bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group"
            loading={isSubmitting}
          >
            <span className="flex items-center justify-center gap-2">
              Sign In <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-sm font-medium text-slate-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-slate-950 font-bold hover:underline underline-offset-4 decoration-2">
              Join for Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
