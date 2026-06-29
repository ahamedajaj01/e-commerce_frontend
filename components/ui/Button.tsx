import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "ghost-light" | "danger" | "success" | "white";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const variants: Record<string, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 shadow-sm",
  secondary: "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm",
  ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors",
  "ghost-light": "text-slate-400 hover:text-slate-700 transition-colors",
  outline: "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm",
  danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm",
  white: "bg-white text-slate-900 hover:bg-slate-50 shadow-sm",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      <span className={cn(loading && "opacity-80")}>{children}</span>
    </button>
  );
}
