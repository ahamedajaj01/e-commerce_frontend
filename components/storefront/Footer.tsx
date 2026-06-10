"use client"
import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#050505] text-white pt-14 sm:pt-24 pb-8 sm:pb-12 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:gap-16 md:grid-cols-4 lg:gap-20">
          {/* Brand Identity */}
          <div className="col-span-2 md:col-span-1 space-y-6 sm:space-y-8 text-center md:text-left">
            <Link href="/" className="flex items-center justify-center md:justify-start gap-3 text-xl sm:text-2xl font-black tracking-[0.2em] uppercase">
              <span>lyralabel</span>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 font-medium max-w-xs mx-auto md:mx-0">
              Curating confidence through fashion. Discover the latest in luxury silhouettes and timeless prints.
            </p>
          </div>


          {/* Legal/Policies - Now with Social */}
          <div className="text-center md:text-left">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white">Follow</h3>
            <ul className="mt-5 sm:mt-8 space-y-3 sm:space-y-5">
              <li><a href="#" className="text-xs sm:text-sm text-slate-500 hover:text-white transition-all duration-300">Instagram</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-slate-500 hover:text-white transition-all duration-300">Facebook</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-slate-500 hover:text-white transition-all duration-300">TikTok</a></li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white">Support</h3>
            <ul className="mt-5 sm:mt-8 space-y-3 sm:space-y-5">
              <li><Link href="/returns" className="text-xs sm:text-sm text-slate-500 hover:text-white transition-all duration-300">Return / Exchange</Link></li>
              <li><Link href="/shipping" className="text-xs sm:text-sm text-slate-500 hover:text-white transition-all duration-300">Shipping Policy</Link></li>
              <li><Link href="/privacy" className="text-xs sm:text-sm text-slate-500 hover:text-white transition-all duration-300">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-xs sm:text-sm text-slate-500 hover:text-white transition-all duration-300">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1 space-y-5 sm:space-y-8 text-center md:text-left">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white">The Inner Circle</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Subscribe for early access to new collections and exclusive drops.</p>
            <form className="flex flex-col gap-3 sm:gap-4" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="YOUR EMAIL ADDRESS"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 sm:py-4 text-[10px] sm:text-xs tracking-widest focus:outline-none focus:border-white focus:ring-0 transition-all placeholder:text-slate-600"
              />
              <button className="w-full bg-white text-black font-black py-3.5 sm:py-4 rounded-xl hover:bg-slate-200 transition-all duration-300 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] uppercase active:bg-slate-300">
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14 sm:mt-24 pt-8 sm:pt-12 border-t border-white/5 flex flex-col items-center justify-between gap-6 sm:gap-8 md:flex-row">
          <p className="text-[9px] sm:text-[10px] text-slate-600 uppercase tracking-[0.3em] sm:tracking-[0.4em] text-center md:text-left">
            © {new Date().getFullYear()} Lyra Label. All rights reserved.
          </p>
          <div className="flex gap-6 sm:gap-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em]">VISA</span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em]">MASTERCARD</span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em]">ESEWA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
