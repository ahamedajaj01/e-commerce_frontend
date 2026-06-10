import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HomeNavbar } from "@/components/storefront/HomeNavbar";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";

export const metadata: Metadata = {
  title: "Lyra Label – Fashion Discoveries",
  description: "Content-driven fashion storefront for curated collections and reels.",
};

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <AnnouncementBar />
      <HomeNavbar />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
