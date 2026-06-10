"use client"
import React, { useState } from "react";

const DEMO_FAQS = [
  { id: "1", q: "How long will it take for my order to reach me ?", a: "Orders usually take 3-5 business days for domestic shipping and 7-14 days for international." },
  { id: "2", q: "How do I cancel my order?", a: "You can cancel your order within 24 hours of placement through your account dashboard or by contacting support." },
  { id: "3", q: "What is your Exchange Policy ?", a: "We offer exchanges within 7 days of delivery for unworn items with tags attached." },
  { id: "4", q: "What is your Return Policy ?", a: "Returns are accepted within 15 days. Refunds are processed to the original payment method." },
  { id: "5", q: "How Can i use my store Credit ?", a: "Store credit can be applied at checkout by selecting 'Store Credit' as a payment option." },
];

export default function FAQSection({ items }: { items?: { id: string; q: string; a?: string }[] }) {
  const faqs = items && items.length ? items : DEMO_FAQS;

  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-4xl font-bold text-slate-900 tracking-tight">FAQs</h2>

        <div className="mt-12">
          {faqs.map((f) => (
            <div key={f.id} className="border-b border-slate-100 last:border-0">
              <button
                onClick={() => setOpen(open === f.id ? null : f.id)}
                className="flex w-full items-center justify-between py-6 text-left outline-none group"
              >
                <span className="text-lg font-medium text-slate-800 group-hover:text-slate-950 transition-colors">{f.q}</span>
                <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                  {open === f.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                  )}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${open === f.id ? "max-h-48 pb-6 opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  {f.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
