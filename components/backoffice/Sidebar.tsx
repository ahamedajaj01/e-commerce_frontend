"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  Tag,
  Shield,
  Megaphone,
  Search,
  Map,
  Settings,
  LogOut,
  Store,
  ShoppingBag,
  Users,
  Bell,
  Terminal,
  Image as ImageIcon,
  CreditCard,
} from "lucide-react";

import { fetchBackofficeNavigationItems } from "@/lib/api/cms";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
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
      { label: "Overview", href: "/backoffice/dashboard", icon: LayoutDashboard },
      { label: "Orders", href: "/backoffice/orders", icon: ShoppingBag },
      { label: "Inventory", href: "/backoffice/inventory", icon: Boxes },
    ],
  },
  {
    title: "Fulfillment",
    items: [
      { label: "Shipping Rules", href: "/backoffice/shipping", icon: Truck },
    ],
  },
  {
    title: "Payment",
    items: [
      { label: "Transactions", href: "/backoffice/payments/transactions", icon: CreditCard },
      { label: "Payment Methods", href: "/backoffice/payments/methods", icon: Shield },
      { label: "Providers", href: "/backoffice/payments/providers", icon: Settings },
    ],
  },
  {
    title: "Commercial",
    items: [
      {
        label: "Catalog",
        href: "#",
        icon: Package,
        children: [
          { label: "All Products", href: "/backoffice/catalog" },
        ]
      },
      { label: "Categories", href: "/backoffice/categories", icon: Tag },
      { label: "Brands", href: "/backoffice/brands", icon: Shield },
      { label: "Campaign Studio", href: "/backoffice/cms/promotions", icon: Megaphone },
      { label: "Announcements", href: "/backoffice/cms/announcements", icon: Megaphone },
      { label: "Visual Banners", href: "/backoffice/marketing", icon: ImageIcon },
    ],
  },
  {
    title: "Storefront",
    items: [
      { label: "Navigation Menus", href: "/backoffice/cms/navigation", icon: Map },
    ],
  },
  {
    title: "System",
    items: [
      { label: "General", href: "/backoffice/settings", icon: Settings },
      { label: "Users", href: "/backoffice/settings/users", icon: Users },
      { label: "Roles & Permissions", href: "/backoffice/settings/roles", icon: Shield },
      { label: "Notifications", href: "/backoffice/settings/notifications", icon: Bell },
      { label: "Activity Logs", href: "/backoffice/settings/logs", icon: Terminal },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, token } = useAuth();

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(NAVIGATION_BASE.map(s => s.title));
  const [dynamicNavigation, setDynamicNavigation] = useState<NavGroup[]>(NAVIGATION_BASE);

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

  useEffect(() => {
    async function syncSidebar() {
      if (!token) return;
      try {
        const navItems = await fetchBackofficeNavigationItems(token);
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

        const seenKeys = new Set<string>();
        const dynamicChildren: { label: string; href: string }[] = [
          { label: "All Products", href: "/backoffice/catalog" }
        ];
        seenKeys.add("/backoffice/catalog");

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
              const customHref = `/backoffice/catalog/sections/${slug}`;
              if (!seenKeys.has(customHref)) {
                dynamicChildren.push({ label: link.label, href: customHref });
                seenKeys.add(customHref);
              }
            }
          }
        });

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

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white h-full flex flex-col fixed left-0 top-0 z-50 shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/backoffice/dashboard" className="flex items-center">
          <span className="text-lg font-black text-slate-900 tracking-tighter uppercase">Lyra Label</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {dynamicNavigation.map((section) => {
          const isSectionExpanded = expandedSections.includes(section.title);
          return (
            <div key={section.title} className="space-y-1.5">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1 group"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                  {section.title}
                </span>
                <ChevronDown className={cn(
                  "w-3 h-3 text-slate-300 transition-transform duration-200",
                  !isSectionExpanded && "-rotate-90"
                )} />
              </button>

              {isSectionExpanded && (
                <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  {section.items.map((item) => {
                    const Icon = item.icon;
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
                              toggleMenu(item.label);
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors group",
                            (isPathActive || isChildActive)
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn("w-4 h-4", (isPathActive || isChildActive) ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                            <span>{item.label}</span>
                          </div>
                          {hasChildren && (
                            <ChevronDown className={cn(
                              "w-3 h-3 transition-transform duration-200 opacity-60",
                              !isMenuExpanded && "-rotate-90"
                            )} />
                          )}
                        </Link>

                        {hasChildren && isMenuExpanded && (
                          <div className="ml-4 mt-0.5 border-l border-slate-100 pl-3 space-y-0.5 animate-in slide-in-from-left-2 duration-200">
                            {item.children?.map((child) => {
                              const isSubActive = pathname === child.href;
                              return (
                                <Link
                                  key={child.label}
                                  href={child.href}
                                  className={cn(
                                    "block px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                                    isSubActive
                                      ? "text-slate-900 bg-slate-50 font-semibold"
                                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                  )}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-3 shrink-0">
        <button
          onClick={logout}
          className="w-full inline-flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
