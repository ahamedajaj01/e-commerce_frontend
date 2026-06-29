"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

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
      console.log("[AuthGuard] Not authenticated, redirecting to:", redirectTo);
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && user) {
      const userRoles = user.roles || [];
      const hasRequiredRole = userRoles.some((role) => allowedRoles.includes(role));

      if (!hasRequiredRole) {
        console.warn("[AuthGuard] Unauthorized access attempted by:", user.email);
        router.replace("/unauthorized");
      }
    }
  }, [isAuthenticated, isLoading, user, router, allowedRoles, redirectTo, hasMounted]);

  // While checking auth status
  if (isLoading || !hasMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Checking Authentication</p>
        </div>
      </div>
    );
  }

  // If we're not authenticated, we're in the process of redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Role check - redundant but safe for the return path
  if (allowedRoles && user) {
    const userRoles = user.roles || [];
    const hasRequiredRole = userRoles.some((role) => allowedRoles.includes(role));
    if (!hasRequiredRole) return null;
  }

  return <>{children}</>;
}
