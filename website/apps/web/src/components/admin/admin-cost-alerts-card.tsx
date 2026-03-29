"use client";

export function AdminCostAlertsCard() {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">Cost / Budget Alerts</div>
      <p className="text-xs text-muted">
        Backend, harita ve hosting budget alertleri prod oncesi aktif edilmelidir.
      </p>
      <div className="mt-3 space-y-2">
        {[
          "Backend usage budget alert",
          "Mapbox monthly usage cap",
          "Vercel build/deploy budget (policy)",
        ].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-line bg-white px-3 py-2 text-xs text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
