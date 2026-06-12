"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

import { fetchBackofficeNavigationItems } from "@/lib/api/cms";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: { label: string; href: string }[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAVIGATION_BASE: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { label: "Overview", href: "/backoffice/dashboard", icon: "📊" },
      { label: "Orders", href: "/backoffice/orders", icon: "📦" },
      { label: "Inventory", href: "/backoffice/inventory", icon: "🏬" },
    ],
  },
  {
    title: "Fulfillment",
    items: [
      { label: "Shipping & Delivery", href: "/backoffice/shipping", icon: "🚚" },
    ],
  },
  {
    title: "Commercial",
    items: [
      {
        label: "Catalog",
        href: "#",
        icon: "👕",
        children: [
          { label: "All Products", href: "/backoffice/catalog" },
        ]
      },
      { label: "Categories", href: "/backoffice/categories", icon: "🏷️" },
      { label: "Campaign Merchandising", href: "/backoffice/cms/promotions", icon: "🛍️" },
      { label: "Announcement Center", href: "/backoffice/cms/announcements", icon: "📢" },
      { label: "Visual Banners", href: "/backoffice/marketing", icon: "🖼️" },
    ],
  },
  {
    title: "Storefront",
    items: [
      { label: "Navigation Menus", href: "/backoffice/cms/navigation", icon: "🧭" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/backoffice/settings", icon: "⚙️" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, token } = useAuth();

  // Track expanded sub-menus (like Catalog)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  // Track expanded high-level sections (like Operations, Commercial)
  const [expandedSections, setExpandedSections] = useState<string[]>(NAVIGATION_BASE.map(s => s.title));
  const [dynamicNavigation, setDynamicNavigation] = useState<NavGroup[]>(NAVIGATION_BASE);

  // Auto-expand the correct section and menu based on URL
  useEffect(() => {
    const activeSection = dynamicNavigation.find(s =>
      s.items.some(item =>
        pathname.startsWith(item.href) ||
        item.children?.some(child => pathname.startsWith(child.href))
      )
    );

    if (activeSection) {
      if (!expandedSections.includes(activeSection.title)) {
        setExpandedSections(prev => [...prev, activeSection.title]);
      }

      const activeItemWithChildren = activeSection.items.find(i =>
        i.children?.some(child => pathname.startsWith(child.href))
      );

      if (activeItemWithChildren && !expandedMenus.includes(activeItemWithChildren.label)) {
        setExpandedMenus(prev => [...prev, activeItemWithChildren.label]);
      }
    }
  }, [pathname, dynamicNavigation]);

  // Fetch navigation to dynamically show/hide Catalog sub-sections
  useEffect(() => {
    async function syncSidebar() {
      if (!token) return;
      try {
        const navItems = await fetchBackofficeNavigationItems(token);

        // Flatten the nav tree to get all possible links
        const allLinks: { label: string; href: string }[] = [];
        const flatten = (items: any[]) => {
          items.forEach(item => {
            const url = item.linked_url || item.href;
            if (url) allLinks.push({ label: item.label, href: url });
            if (item.children) flatten(item.children);
          });
        };
        flatten(navItems);

        const systemMapping: Record<string, { label: string, href: string }> = {
          "new-arrivals": { label: "New Arrivals", href: "/backoffice/catalog/sections/new-arrivals" },
          "trending": { label: "Trending Now", href: "/backoffice/catalog/sections/trending" },
          "best-sellers": { label: "Best Sellers", href: "/backoffice/catalog/sections/best-sellers" },
          "homepage": { label: "Homepage Selection", href: "/backoffice/catalog/sections/homepage" },
          "exclusive": { label: "Exclusive Collection", href: "/backoffice/catalog/sections/exclusive-collection" },
        };

        // Track seen links to avoid duplicates
        const seenKeys = new Set<string>();
        const dynamicChildren: { label: string; href: string }[] = [
          { label: "All Products", href: "/backoffice/catalog" }
        ];
        seenKeys.add("/backoffice/catalog");

        // 1. Process /collections/ links from Navbar
        allLinks.forEach(link => {
          const collectionMatch = link.href.match(/\/collections\/([^/]+)/);
          if (collectionMatch) {
            const slug = collectionMatch[1];
            const systemEntry = systemMapping[slug];

            if (systemEntry) {
              if (!seenKeys.has(systemEntry.href)) {
                dynamicChildren.push(systemEntry);
                seenKeys.add(systemEntry.href);
              }
            } else {
              // Custom Collection link in Nav
              const customHref = `/backoffice/catalog/sections/${slug}`;
              if (!seenKeys.has(customHref)) {
                dynamicChildren.push({ label: link.label, href: customHref });
                seenKeys.add(customHref);
              }
            }
          }
        });

        // 2. Ensure "Homepage Selection" and "Exclusive Collection" are ALWAYS there even if not in Nav
        const essentials = ["homepage", "exclusive"];
        essentials.forEach(key => {
          const entry = systemMapping[key];
          if (entry && !seenKeys.has(entry.href)) {
            dynamicChildren.push(entry);
            seenKeys.add(entry.href);
          }
        });

        setDynamicNavigation(prev => {
          const next = [...prev];
          const commercialIdx = next.findIndex(n => n.title === "Commercial");
          if (commercialIdx > -1) {
            const catalogIdx = next[commercialIdx].items.findIndex(i => i.label === "Catalog");
            if (catalogIdx > -1) {
              next[commercialIdx].items[catalogIdx].children = dynamicChildren;
            }
          }
          return next;
        });
      } catch (e) {
        console.warn("[Sidebar] Dynamic sync failed:", e);
      }
    }

    syncSidebar();
  }, [token]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const toggleMenu = (label: string, e: React.MouseEvent) => {
    const isExpanded = expandedMenus.includes(label);
    if (isExpanded) {
      setExpandedMenus(prev => prev.filter(m => m !== label));
    } else {
      setExpandedMenus(prev => [...prev, label]);
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white h-full flex flex-col fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6 h-16 flex items-center border-b border-slate-100">
        <Link href="/backoffice/dashboard" className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-slate-950 flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-slate-200">AI</div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900">Lyra Label</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {dynamicNavigation.map((section) => {
          const isSectionExpanded = expandedSections.includes(section.title);

          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 group cursor-pointer"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-900 transition-colors">
                  {section.title}
                </p>
                <ChevronRight className={cn(
                  "w-3 h-3 text-slate-300 transition-transform duration-300",
                  isSectionExpanded ? "rotate-90 text-slate-950" : ""
                )} />
              </button>

              <div className={cn(
                "space-y-0.5 overflow-hidden transition-all duration-300",
                isSectionExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              )}>
                {section.items.map((item) => {
                  const isPathActive = pathname === item.href || (item.href !== "/backoffice" && pathname.startsWith(item.href + "/"));
                  const hasChildren = item.children && item.children.length > 0;
                  const isChildActive = hasChildren && item.children?.some(child => pathname === child.href);
                  const isMenuExpanded = expandedMenus.includes(item.label);

                  return (
                    <div key={item.label} className="space-y-0.5">
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          if (hasChildren || item.href === "#") {
                            e.preventDefault();
                            if (hasChildren) toggleMenu(item.label, e);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-semibold transition-all duration-150 group",
                          (isPathActive || isChildActive)
                            ? "bg-slate-50 text-slate-900 border border-slate-200 shadow-sm"
                            : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[13px] opacity-90 transition-transform group-hover:scale-110">{item.icon}</span>
                          <span className="tracking-tight">{item.label}</span>
                        </div>
                        {hasChildren && (
                          <span className={cn(
                            "text-[10px] transition-transform duration-300 opacity-30",
                            isMenuExpanded ? "rotate-90" : ""
                          )}>▶</span>
                        )}
                      </Link>

                      {hasChildren && isMenuExpanded && (
                        <div className="ml-5 mt-1 border-l border-slate-100 pl-4 space-y-0.5 pt-0.5 pb-2 animate-in slide-in-from-left-2 duration-300">
                          {item.children?.map((child) => {
                            const isSubActive = pathname === child.href;
                            return (
                              <Link
                                key={child.label}
                                href={child.href}
                                className={cn(
                                  "relative block px-3 py-2 rounded-md text-[11px] font-medium transition-all group/sub",
                                  isSubActive
                                    ? "text-fuchsia-600 bg-fuchsia-50/40"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50/50"
                                )}
                              >
                                {isSubActive && (
                                  <span className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-1 h-3 bg-fuchsia-500 rounded-r-full" />
                                )}
                                <span className="relative z-10 transition-transform group-hover/sub:translate-x-1 inline-block">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-fuchsia-100 flex items-center justify-center text-[10px] font-bold text-fuchsia-700">
            {user?.name?.charAt(0) || "S"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-900 truncate">
              {user?.name || user?.email?.split('@')[0] || "Staff Member"}
            </p>
            <p className="text-[9px] text-slate-400 font-bold truncate uppercase tracking-widest">
              {user?.roles?.[0] || user?.role || "Verified"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
        >
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
