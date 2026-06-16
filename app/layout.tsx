import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ModalProvider } from "@/providers/ModalProvider";
import { CartProvider } from "@/providers/CartProvider";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Lyra Label — Unified Commerce Platform",
  description:
    "Production-grade fashion-commerce platform with content-driven storefront and operational backoffice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased selection:bg-fuchsia-500/30">
        <Suspense fallback={null}>
          <LoadingOverlay />
        </Suspense>
        <AuthProvider>
          <ModalProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
