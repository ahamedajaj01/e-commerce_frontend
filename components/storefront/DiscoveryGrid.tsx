import Link from "next/link";
import { Clock, Star, TrendingUp, Sparkles } from "lucide-react";

const DISCOVERY_ITEMS = [
    { label: "New Arrivals", slug: "new-arrivals", icon: Clock, color: "bg-fuchsia-50" },
    { label: "Best Sellers", slug: "best-sellers", icon: Star, color: "bg-indigo-50" },
    { label: "Trending", slug: "trending", icon: TrendingUp, color: "bg-emerald-50" },
    { label: "Exclusives", slug: "exclusives", icon: Sparkles, color: "bg-amber-50" },
];

export function DiscoveryGrid() {
    return (
        <section className="bg-white py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {DISCOVERY_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.slug}
                                href={`/collections/${item.slug}`}
                                className="group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:bg-white"
                            >
                                <div className={`mb-4 p-4 rounded-full ${item.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
                                    <Icon className="w-6 h-6 text-slate-900" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Explore</span>
                                <span className="text-sm font-black uppercase tracking-widest text-slate-900 group-hover:text-fuchsia-600 transition-colors">{item.label}</span>

                                <div className="absolute top-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-ping" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
