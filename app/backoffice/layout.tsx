"use client";

import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/backoffice/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Allow access if user is staff OR has an explicit allowed role
  const staffRoles = ["admin", "inventory", "marketing", "support", "staff"];
  const hasAccess = user?.is_staff || (user?.roles || []).some(r => staffRoles.includes(r)) || staffRoles.includes(user?.role || "");

  return (
    <AuthGuard allowedRoles={hasAccess ? undefined : staffRoles}>
      <div className="min-h-screen bg-[#fafafa] flex overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          
          :root {
            --font-jakarta: 'Plus Jakarta Sans', sans-serif;
          }

          .backoffice-root {
            font-family: var(--font-jakarta);
            color: #0f172a;
          }

          input, textarea, select {
            font-family: var(--font-jakarta) !important;
            color: #0f172a !important;
            font-weight: 600 !important;
            letter-spacing: -0.01em !important;
          }

          input::placeholder, textarea::placeholder {
            color: #94a3b8 !important;
            font-weight: 500 !important;
          }

          h1, h2, h3, h4, h5, h6, button {
            font-family: var(--font-jakarta) !important;
          }

          label {
            color: #64748b !important;
            font-weight: 700 !important;
          }
        `}</style>

        <div className="backoffice-root flex w-full h-full">
          <Sidebar />

          <div className="flex-1 flex flex-col min-w-0 pl-64">
            <main className="p-10 pb-20 max-w-[1600px] bg-[#fafafa]">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
