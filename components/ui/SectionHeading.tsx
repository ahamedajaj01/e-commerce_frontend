interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  description?: string;
}

export function SectionHeading({ title, subtitle, description }: SectionHeadingProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.45em] text-fuchsia-300">
        <span className="h-px flex-1 bg-slate-800" />
        <span>{subtitle ?? title}</span>
        <span className="h-px flex-1 bg-slate-800" />
      </div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{description}</p> : null}
      </div>
    </div>
  );
}
