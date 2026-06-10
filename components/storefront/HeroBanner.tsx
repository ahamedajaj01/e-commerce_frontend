import { Button } from "@/components/ui/Button";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-950 px-6 py-14 shadow-2xl shadow-slate-950/40 sm:px-10 sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(244,63,94,0.12),_transparent_25%)]" />
      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-fuchsia-300">Fashion discovery reimagined</p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Discover curated looks, new arrivals, and fashion reels made for your wardrobe.
          </h1>
          <p className="max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            A content-driven fashion commerce experience designed for discovery first, checkout later, and storytelling at every scroll.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button>Shop the collection</Button>
            <Button variant="secondary">Browse reels</Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-h-[260px] rounded-[2rem] bg-white/5 p-5 shadow-lg shadow-slate-950/30">
            <div className="h-full rounded-[1.75rem] bg-gradient-to-br from-fuchsia-500/20 to-violet-500/10 p-5">
              <div className="h-full rounded-[1.5rem] bg-slate-950/90" />
            </div>
          </div>
          <div className="min-h-[260px] rounded-[2rem] bg-white/5 p-5 shadow-lg shadow-slate-950/30">
            <div className="h-full rounded-[1.75rem] bg-gradient-to-br from-sky-500/15 to-cyan-500/10 p-5">
              <div className="h-full rounded-[1.5rem] bg-slate-950/90" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
