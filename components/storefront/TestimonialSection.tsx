"use client"
import React, { useState } from "react";

type Testimonial = { id: string; name: string; text: string; image: string };

const DEMO_TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "monica ningthoujam",
    text: "I love it... It fits so well❤️",
    image: "https://images.unsplash.com/photo-1595776613215-fe04b78de7d0?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Kanwal",
    text: "This is such a pretty dress. Such soft material slipped like butter on me. I was initially worried...",
    image: "https://images.unsplash.com/photo-1539109132384-361555771c9b?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Pawani",
    text: "I love this dresss 🤤 🤤 🤤 ❤️ ❤️ ❤️ ❤️ Thankyou so so much 🥰",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2070&auto=format&fit=crop",
  },
];

export default function TestimonialSection({ items }: { items?: Testimonial[] }) {
  const data = items && items.length ? items : DEMO_TESTIMONIALS;
  const [index, setIndex] = useState(0);

  function prev() {
    setIndex((i) => (i - 1 + data.length) % data.length);
  }
  function next() {
    setIndex((i) => (i + 1) % data.length);
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900 tracking-tight">Our Customers Love Us</h2>

        <div className="relative mt-12 px-12">
          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 transition-colors"
            aria-label="Previous testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m15 18-6-6 6-6" /></svg>
          </button>

          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 transition-colors"
            aria-label="Next testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m9 18 6-6-6-6" /></svg>
          </button>

          <div className="grid gap-8 md:grid-cols-3">
            {data.map((t, i) => (
              <div
                key={t.id}
                className={`flex flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 transition-all duration-300 ${i === index ? "block" : "hidden md:flex"
                  }`}
              >
                <div className="aspect-[4/5] overflow-hidden bg-slate-100">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="h-full w-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <div className="p-6 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-bold text-slate-900 capitalize">{t.name}</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-600"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 italic">
                    "{t.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
