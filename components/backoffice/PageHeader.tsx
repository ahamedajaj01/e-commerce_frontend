"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    category?: string;
    actions?: ReactNode;
    breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, subtitle, category, actions, breadcrumbs }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-6 mb-10">
            {breadcrumbs && (
                <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={crumb.label} className="flex items-center gap-2">
                            {i > 0 && <span className="opacity-30">/</span>}
                            <span className={crumb.href ? "hover:text-slate-900 transition-colors cursor-pointer" : ""}>
                                {crumb.label}
                            </span>
                        </span>
                    ))}
                </nav>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-1">
                    {category && (
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-600 mb-2">
                            {category}
                        </p>
                    )}
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm font-medium text-slate-500 max-w-2xl mt-2 leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
