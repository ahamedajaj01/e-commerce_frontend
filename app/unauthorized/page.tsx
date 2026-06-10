export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 px-4 py-16">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-slate-900/95 p-10 text-center shadow-2xl shadow-slate-950/40">
        <p className="text-sm uppercase tracking-[0.35em] text-fuchsia-300">Access denied</p>
        <h1 className="mt-4 text-4xl font-black text-white">You do not have permission to view this page.</h1>
        <p className="mt-5 text-sm leading-7 text-slate-400">
          If you believe this is a mistake, sign in with a different account or contact your administrator.
        </p>
        <a
          href="/login"
          className="mt-8 inline-flex rounded-full bg-fuchsia-500 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-400"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}
