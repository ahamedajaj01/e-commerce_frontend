interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "ghost-light";
}

const variants: Record<string, string> = {
  primary: "bg-fuchsia-500 text-slate-950 hover:bg-fuchsia-400",
  secondary: "border border-slate-700 text-slate-100 hover:bg-slate-900",
  ghost: "text-slate-100 hover:text-white",
  outline: "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm",
  "ghost-light": "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent transition-colors",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
