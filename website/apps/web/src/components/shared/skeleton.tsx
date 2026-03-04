type SkeletonRowProps = {
  /** Number of rows to render */
  count?: number;
  /** Height of each row */
  height?: string;
};

/**
 * Shimmer-animated skeleton rows — used as loading placeholders.
 * Always rounded-xl, no sharp edges.
 */
export function SkeletonRow({ count = 3, height = "h-14" }: SkeletonRowProps) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} animate-pulse rounded-xl bg-slate-100`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

type SkeletonCardProps = {
  count?: number;
};

/**
 * Shimmer-animated skeleton cards — used as KPI card loading placeholders.
 * Always rounded-2xl, no sharp edges.
 */
export function SkeletonCard({ count = 4 }: SkeletonCardProps) {
  return (
    <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-2.5 w-16 rounded-lg bg-slate-100" />
          <div className="mt-4 h-8 w-14 rounded-xl bg-slate-100" />
          <div className="mt-3 h-2 w-24 rounded-lg bg-slate-50" />
        </div>
      ))}
    </div>
  );
}
