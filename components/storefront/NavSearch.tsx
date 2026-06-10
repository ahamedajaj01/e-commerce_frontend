"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { fetchProducts } from "@/lib/api/catalog";
import { Product } from "@/types/product";
import { getMediaUrl } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Debouncing logic
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await fetchProducts({ search: query });
                const products = Array.isArray(data) ? data : (data as any).results || [];
                setResults(products.slice(0, 5));
                setHasSearched(true);
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 500); // Increased delay slightly as requested

        return () => clearTimeout(timer);
    }, [query]);

    // Handle focus and scroll lock
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setHasSearched(false);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/products?search=${encodeURIComponent(query)}`);
            handleClose();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Search"
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-slate-50 group"
            >
                <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
                    {/* Blurred Backdrop - keeps user on the same page visually */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    {/* Search Bar Container */}
                    <div className="relative w-full max-w-4xl mx-auto mt-4 sm:mt-8 px-4 animate-in slide-in-from-top-4 duration-500">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-950/20 overflow-hidden border border-slate-100">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="relative flex items-center p-4 sm:p-6"
                            >
                                <Search className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors ${query ? 'text-slate-950' : 'text-slate-300'}`} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search your next discovery..."
                                    className="flex-1 bg-transparent px-4 sm:px-6 text-xl sm:text-3xl font-black text-slate-950 placeholder:text-slate-200 focus:outline-none"
                                />
                                <div className="flex items-center gap-3">
                                    {isLoading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-950 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </form>

                            {/* Suggestions Dropdown Area */}
                            {(query || results.length > 0) && (
                                <div className="border-t border-slate-50 bg-slate-50/50 p-6 sm:p-10 max-h-[70vh] overflow-y-auto">
                                    {results.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Exact Results</h3>
                                                <Link
                                                    href={`/products?search=${encodeURIComponent(query)}`}
                                                    onClick={handleClose}
                                                    className="text-[10px] font-black uppercase tracking-widest text-slate-950 hover:bg-slate-950 hover:text-white px-3 py-1 rounded-full transition-all"
                                                >
                                                    Show All
                                                </Link>
                                            </div>
                                            <div className="grid gap-3">
                                                {results.map((product) => (
                                                    <Link
                                                        key={product.id}
                                                        href={`/products/${product.slug}`}
                                                        onClick={handleClose}
                                                        className="group flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 hover:border-slate-950 hover:shadow-lg transition-all"
                                                    >
                                                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                                            <img
                                                                src={getMediaUrl(product.image || product.main_image)}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-base sm:text-lg font-black text-slate-950 truncate">{product.name}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category_detail?.name || 'Discovery'}</p>
                                                        </div>
                                                        <div className="text-right px-4">
                                                            <p className="text-sm font-black text-slate-950">Rs {product.base_price}</p>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 ml-auto mt-1 group-hover:text-slate-950 group-hover:translate-x-1 transition-all" />
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ) : hasSearched && !isLoading ? (
                                        <div className="py-12 text-center">
                                            <p className="text-lg font-black text-slate-950 italic">"No exact matches found"</p>
                                            <p className="text-xs text-slate-400 mt-2">Try adjusting your keywords</p>
                                        </div>
                                    ) : (
                                        <div className="py-12 flex items-center justify-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-slate-200 animate-bounce [animation-delay:-0.3s]" />
                                            <div className="h-2 w-2 rounded-full bg-slate-200 animate-bounce [animation-delay:-0.15s]" />
                                            <div className="h-2 w-2 rounded-full bg-slate-200 animate-bounce" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
