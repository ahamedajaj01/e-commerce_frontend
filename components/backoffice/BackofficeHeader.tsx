"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function BackofficeHeader() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col gap-6 rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-fuchsia-600">Staff Dashboard</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900 leading-tight">
          Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || "Staff"}
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-medium">Manage your fashion domain operations from here.</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Assigned Roles</span>
          <span className="rounded-full bg-slate-50 border border-slate-100 px-5 py-2 text-xs font-black uppercase tracking-widest text-slate-800 shadow-sm">
            {(user?.roles || []).join(" • ") || "Staff"}
          </span>
        </div>
        <button
          onClick={logout}
          className="rounded-2xl bg-slate-900 px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all duration-300 active:scale-95"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
