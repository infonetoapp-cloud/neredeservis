export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <div className="mb-4 h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mb-2 h-8 w-56 animate-pulse rounded bg-slate-200" />
          <div className="mb-8 h-4 w-40 animate-pulse rounded bg-slate-100" />
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
