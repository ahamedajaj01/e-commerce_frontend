"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  allowedRoles,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading || !hasMounted) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && user && !(user.roles || []).some((role) => allowedRoles.includes(role))) {
      router.replace("/unauthorized");
    }
  }, [isAuthenticated, isLoading, user, router, allowedRoles, redirectTo]);

  // Show loading screen only on initial load or if we are definitely not authenticated yet
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-3xl border border-slate-700/70 bg-slate-900/95 px-10 py-8 text-center shadow-xl shadow-slate-950/40">
          <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
          <p className="text-sm font-black uppercase tracking-[0.2em]">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If we're not authenticated and not loading, we should be redirecting
  // We'll return null to avoid flashing content while the redirect happens
  if (!isAuthenticated) {
    return null;
  }

  // Role check
  if (allowedRoles && user && !(user.roles || []).some((role) => allowedRoles.includes(role))) {
    return null; // The useEffect will handle the redirect to /unauthorized
  }

  return <>{children}</>;
}
