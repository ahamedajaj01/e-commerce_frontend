import Link from "next/link";
import { Search, ArrowLeft, Home } from "lucide-react";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { HomeNavbar } from "@/components/storefront/HomeNavbar";
import { Footer } from "@/components/storefront/Footer";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
            <AnnouncementBar />
            <HomeNavbar />

            <main className="flex-1 flex items-center justify-center relative overflow-hidden py-24 sm:py-32">
                {/* Architectural Background Text */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <h1 className="text-[20vw] sm:text-[30vw] font-black leading-none">404</h1>
                </div>

                <div className="relative z-10 text-center px-4 space-y-12 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="space-y-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                            <Search className="w-5 h-5" />
                        </div>
                        <h2 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tighter uppercase leading-tight">
                            Lost in <br />
                            <span className="text-fuchsia-600">Discoveries.</span>
                        </h2>
                        <p className="text-[13px] sm:text-sm text-slate-500 font-medium tracking-wide max-w-sm mx-auto leading-relaxed">
                            The piece you are looking for has likely been moved to our archives or never existed. Let's get you back on track.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href="/"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-slate-950 text-white px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 active:scale-95 transition-all shadow-2xl shadow-slate-200"
                        >
                            <Home className="w-4 h-4" />
                            Return Home
                        </Link>
                        <Link
                            href="/products"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-950 px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:border-slate-950 active:scale-95 transition-all"
                        >
                            Explore Collection
                        </Link>
                    </div>

                    <div className="pt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        <div className="h-px w-8 bg-slate-100" />
                        <span>Lyra Label Est. 2024</span>
                        <div className="h-px w-8 bg-slate-100" />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
