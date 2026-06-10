import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login – Lyra Label",
  description: "Access your fashion account and staff dashboard.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden">
      {/* Subtle Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-[160px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-100/40 rounded-full blur-[160px]" />

      <header className="relative z-10 p-12 flex justify-center">
        <Link href="/" className="flex flex-col items-center leading-none group transition-transform hover:scale-105">
          <span className="text-2xl font-black tracking-tighter text-slate-950">LYRA</span>
          <span className="text-[9px] font-bold tracking-[0.4em] text-slate-400 -mt-0.5 ml-0.5">LABEL</span>
        </Link>
      </header>

      <div className="relative z-10 flex-1 mx-auto flex w-full items-center justify-center px-4 py-8 sm:px-6">
        {children}
      </div>

      <footer className="relative z-10 p-12 text-center">
        <div className="mx-auto max-w-xs h-[1px] bg-slate-200 mb-8" />
        <p className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-bold">
          &copy; {new Date().getFullYear()} Lyra Label. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
