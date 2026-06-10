"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, TrendingUp, Star, Zap, Clock, Tag } from "lucide-react";

const DISCOVERY_LINKS = [
    { label: "New Arrivals", href: "/collections/new-arrivals", icon: Clock },
    { label: "Best Sellers", href: "/collections/best-sellers", icon: Star },
    { label: "Trending Now", href: "/collections/trending", icon: TrendingUp },
    { label: "Exclusives", href: "/collections/exclusives", icon: Sparkles },
];

interface CatalogSidebarProps {
    categories: any[];
}

export function CatalogSidebar({ categories }: CatalogSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-full lg:w-64 space-y-12 pr-8">
            {/* 1. Discovery Collections */}
            <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Discovery</p>
                <div className="grid gap-2">
                    {DISCOVERY_LINKS.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
                                    ? "bg-slate-950 text-white shadow-xl shadow-slate-200"
                                    : "text-slate-500 hover:bg-white hover:text-fuchsia-600 hover:shadow-md"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? "text-fuchsia-400" : "text-slate-400 group-hover:text-fuchsia-400"}`} />
                                <span className="text-[11px] font-black uppercase tracking-widest">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* 2. Categories */}
            <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Collections</p>
                <div className="grid gap-2">
                    <Link
                        href="/products"
                        className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${pathname === "/products"
                            ? "bg-slate-950 text-white shadow-xl shadow-slate-200"
                            : "text-slate-500 hover:bg-white hover:text-fuchsia-600 hover:shadow-md"
                            }`}
                    >
                        <Zap className="w-4 h-4 text-slate-400 group-hover:text-fuchsia-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Main Catalog</span>
                    </Link>
                    {categories.map((cat) => {
                        const href = `/collections/${cat.slug}`;
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={cat.id}
                                href={href}
                                className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
                                    ? "bg-slate-950 text-white shadow-xl shadow-slate-200"
                                    : "text-slate-500 hover:bg-white hover:text-fuchsia-600 hover:shadow-md"
                                    }`}
                            >
                                <Tag className={`w-4 h-4 ${isActive ? "text-fuchsia-400" : "text-slate-400 group-hover:text-fuchsia-400"}`} />
                                <span className="text-[11px] font-black uppercase tracking-widest truncate">{cat.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* 3. Aesthetic Banner */}
            <div className="relative overflow-hidden rounded-[2rem] bg-indigo-600 p-8 text-white shadow-2xl">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <h4 className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-indigo-200">Season Edit</h4>
                <p className="relative z-10 text-xs font-bold leading-relaxed mb-4">New styles added to the archive daily.</p>
                <button className="relative z-10 text-[9px] font-black uppercase tracking-widest border-b border-white pb-1 hover:text-indigo-200 hover:border-indigo-200 transition">View Collection</button>
            </div>
        </aside>
    );
}
