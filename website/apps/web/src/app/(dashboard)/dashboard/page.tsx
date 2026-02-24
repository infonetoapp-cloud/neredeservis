import { AuthSessionStatusCard } from "@/components/auth/auth-session-status-card";

type DashboardPageProps = {
  searchParams?: Promise<{ mode?: string }>;
};

export default async function DashboardPlaceholderPage({
  searchParams,
}: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const modeLabel =
    params.mode === "individual" ? "individual (placeholder)" : "company (placeholder)";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="text-xs font-medium text-muted">Aktif Mod</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{modeLabel}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Aktif Sefer", "12"],
          ["Canli Arac", "37"],
          ["Online Sofor", "29"],
          ["Uyari", "3"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-xs font-medium text-muted">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
          </div>
        ))}
      </div>

      <AuthSessionStatusCard />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-900">
            Live Ops Harita Alani (Placeholder)
          </div>
          <div className="h-80 rounded-xl border border-line bg-gradient-to-br from-slate-100 to-white" />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-900">
            Dispatch Kuyrugu (Placeholder)
          </div>
          <div className="space-y-3">
            {["Rota atama bekliyor", "Driver ping gecikmesi", "Stop update istegi"].map(
              (item) => (
                <div key={item} className="rounded-xl border border-line p-3">
                  <div className="text-sm font-medium text-slate-900">{item}</div>
                  <div className="mt-1 text-xs text-muted">Placeholder item</div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
