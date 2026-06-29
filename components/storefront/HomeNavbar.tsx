"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { fetchNavigation } from "@/lib/api/cms";
import type { NavigationItem } from "@/types/cms";
import { getMediaUrl } from "@/lib/utils";
import { Search, User, ShoppingBag, Heart, ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { NavSearch } from "./NavSearch";

export function HomeNavbar() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchNavigation().catch(() => []),
      import("@/lib/api/catalog").then(m => m.fetchCategories().catch(() => []))
    ]).then(([navData, catData]) => {
      const items = Array.isArray(navData) ? navData : (navData as any)?.results || [];
      const cats = Array.isArray(catData) ? catData : (catData as any)?.results || [];

      // Filter out inactive items (recursively if needed, but top level first)
      const visibleItems = items
        .filter((item: NavigationItem) => item.is_active !== false)
        .map((item: NavigationItem) => ({
          ...item,
          children: item.children?.filter(child => child.is_active !== false)
        }));

      setMenuItems([...visibleItems].sort((a, b) => a.sort_order - b.sort_order));
      setCategories(cats);
    }).finally(() => setIsLoading(false));
  }, []);

  const cart = useCart();
  const totalItems = cart?.totalItems ?? 0;
  const [openId, setOpenId] = useState<string | null>(null);

  const handleAccountClick = () => {
    if (isAuthenticated) {
      if (user?.is_staff || user?.role === "admin") {
        router.push("/backoffice/dashboard");
      } else {
        router.push("/profile");
      }
    } else {
      router.push("/login");
    }
  };

  const getUrl = (item: NavigationItem) => {
    if (item.href) return item.href;
    if (item.category_slug) return `/collections/${item.category_slug}`;
    return "#";
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Hamburger — Mobile Only */}
        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:text-slate-900 transition"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none group transition-transform hover:scale-105">
          <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-950">LYRA</span>
          <span className="text-[9px] sm:text-[11px] font-bold tracking-[0.4em] text-slate-400 -mt-1 ml-0.5">LABEL</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-10 text-slate-950">
          <div
            className="relative h-16 flex items-center"
            onMouseEnter={() => setOpenId("shop-by-category")}
            onFocus={() => setOpenId("shop-by-category")}
            onMouseLeave={() => setOpenId(null)}
          >
            <button className="flex items-center gap-1.5 transition-colors hover:text-slate-500 font-bold text-xs uppercase tracking-widest">
              <span>Categories</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openId === "shop-by-category" ? "rotate-180" : "opacity-40"}`} />
            </button>
            {openId === "shop-by-category" && categories.length > 0 && (
              <div className="absolute left-0 top-[calc(100%-4px)] z-50 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid gap-1">
                  {categories.map((cat) => (
                    <div key={cat.id} className="relative group/cat">
                      <Link
                        href={`/collections/${cat.slug}`}
                        className="flex items-center justify-between rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 group"
                      >
                        <span className="text-[11px] font-bold uppercase tracking-widest">{cat.name}</span>
                        {cat.children && cat.children.length > 0 && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                        )}
                      </Link>

                      {/* Desktop Nested Flyout */}
                      {cat.children && cat.children.length > 0 && (
                        <div className="absolute left-full top-0 ml-1 hidden group-hover/cat:block z-50 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                          <div className="grid gap-1">
                            {cat.children.map((sub: any) => (
                              <Link
                                key={sub.id}
                                href={`/collections/${sub.slug}`}
                                className="flex items-center justify-between rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 group/item"
                              >
                                <span className="text-[11px] font-bold uppercase tracking-widest">{sub.name}</span>
                                <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 -mr-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 -translate-x-2 transition-all" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Combined Dynamic & Permanent Nav Items */}
          <div className="flex items-center gap-8 xl:gap-12 h-16">
            {menuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;

              if (hasChildren) {
                return (
                  <div
                    key={item.id}
                    className="relative h-16 flex items-center"
                    onMouseEnter={() => setOpenId(item.id)}
                    onFocus={() => setOpenId(item.id)}
                    onMouseLeave={() => setOpenId(null)}
                  >
                    <button className={`flex items-center gap-1.5 transition-colors hover:text-slate-500 font-bold text-xs uppercase tracking-widest ${item.is_featured ? "text-fuchsia-600" : "text-slate-900"}`}>
                      <span>{item.label}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openId === item.id ? "rotate-180" : "opacity-40"}`} />
                    </button>
                    {openId === item.id && (
                      <div className="absolute left-0 top-[calc(100%-4px)] z-50 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid gap-1">
                          {item.children?.map((child) => (
                            <Link
                              key={child.id}
                              href={getUrl(child)}
                              className="flex items-center justify-between rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 group/item"
                            >
                              <span className="text-[11px] font-bold uppercase tracking-widest">{child.label}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover/item:text-slate-900 transition-colors" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={getUrl(item)}
                  className={`relative flex items-center transition-colors font-bold text-xs uppercase tracking-widest hover:text-slate-500 ${item.is_featured ? "text-fuchsia-600" : "text-slate-900"}`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Permanent Anchor Links */}
            <Link href="/return-policy" className="font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Returns</Link>
            {!isAuthenticated && (
              <Link href="/track-order" className="font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Track Order</Link>
            )}
            <Link href="/contact" className="font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Support</Link>
          </div>
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3 text-slate-950">
          <NavSearch />
          <button
            aria-label="Account"
            onClick={handleAccountClick}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-slate-50 group"
          >
            <User className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>

          {/* Desktop Cart Button (Opens Drawer) */}
          <button
            onClick={() => cart.openCart()}
            aria-label="Cart Drawer"
            className="hidden lg:relative lg:w-10 lg:h-10 lg:flex lg:items-center lg:justify-center lg:rounded-full lg:transition-colors lg:hover:bg-slate-50 lg:group"
          >
            <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
            {totalItems > 0 ? (
              <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] font-black text-white ring-2 ring-white">
                {totalItems}
              </span>
            ) : null}
          </button>

          {/* Mobile Cart Link (Opens Separate Page) */}
          <Link
            href="/cart"
            aria-label="Cart Page"
            className="relative lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-slate-50 group"
          >
            <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
            {totalItems > 0 ? (
              <span className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] font-black text-white ring-2 ring-white">
                {totalItems}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {/* ── MOBILE SLIDE-OUT MENU ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

          {/* Panel */}
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <Link href="/" className="flex flex-col leading-none" onClick={() => setMobileOpen(false)}>
                <span className="text-lg font-black tracking-tighter text-slate-950">LYRA</span>
                <span className="text-[8px] font-black tracking-[0.4em] text-slate-400 -mt-0.5">LABEL</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="px-6 py-6 space-y-1">
              {/* Shop by Category (Accordion) */}
              <div>
                <button
                  onClick={() => setMobileCatOpen(!mobileCatOpen)}
                  className="w-full flex items-center justify-between py-3.5 text-sm font-bold text-slate-900 uppercase tracking-widest"
                >
                  Shop by Category
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${mobileCatOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileCatOpen && categories.length > 0 && (
                  <div className="pl-4 pb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {categories.map((cat) => {
                      const hasSub = cat.children && cat.children.length > 0;
                      return (
                        <div key={cat.id}>
                          <div className="flex items-center justify-between group">
                            <Link
                              href={`/collections/${cat.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 py-2.5 text-slate-600 hover:text-slate-900 transition flex-1"
                            >
                              <span className="text-[12px] font-bold uppercase tracking-widest">{cat.name}</span>
                            </Link>

                            {hasSub && (
                              <button
                                onClick={() => setOpenId(openId === `cat-${cat.id}` ? null : `cat-${cat.id}`)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition"
                              >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openId === `cat-${cat.id}` ? "rotate-180" : ""}`} />
                              </button>
                            )}
                          </div>

                          {/* Mobile Subcategories */}
                          {hasSub && openId === `cat-${cat.id}` && (
                            <div className="pl-11 py-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              {cat.children.map((sub: any) => (
                                <Link
                                  key={sub.id}
                                  href={`/collections/${sub.slug}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="block py-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {/* Dynamic Nav Links */}
              {menuItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;

                if (hasChildren) {
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => setOpenId(openId === item.id ? null : item.id)}
                        className={`w-full flex items-center justify-between py-3.5 text-sm font-bold uppercase tracking-widest ${item.is_featured ? "text-fuchsia-600" : "text-slate-900"}`}
                      >
                        {item.label}
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openId === item.id ? "rotate-180" : ""}`} />
                      </button>
                      {openId === item.id && (
                        <div className="pl-4 pb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          {item.children?.map((child) => (
                            <Link
                              key={child.id}
                              href={getUrl(child)}
                              onClick={() => setMobileOpen(false)}
                              className="block py-2.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={getUrl(item)}
                    onClick={() => setMobileOpen(false)}
                    className={`block py-3.5 text-sm font-bold uppercase tracking-widest transition hover:text-fuchsia-600 ${item.is_featured ? "text-fuchsia-600" : "text-slate-900"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="h-px bg-slate-100 my-2" />

              {/* Permanent Mobile Bottom Links */}
              <Link href="/return-policy" onClick={() => setMobileOpen(false)} className="block py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-fuchsia-600 transition">Return / Exchange</Link>
              {!isAuthenticated && (
                <Link href="/track-order" onClick={() => setMobileOpen(false)} className="block py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-fuchsia-600 transition">Track Your Order</Link>
              )}
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="block py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-fuchsia-600 transition">Contact Us</Link>
            </nav>

            {/* Mobile Bottom Actions */}
            <div className="px-6 py-6 border-t border-slate-100 space-y-4">
              <button
                onClick={() => { handleAccountClick(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 py-3 text-sm font-bold text-slate-700 hover:text-slate-900 transition"
              >
                <User className="w-5 h-5" />
                {isAuthenticated ? "My Account" : "Sign In"}
              </button>
              <button className="w-full flex items-center gap-3 py-3 text-sm font-bold text-slate-700 hover:text-slate-900 transition">
                <Heart className="w-5 h-5" />
                Wishlist
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
