import { CompanyLiveOpsSnapshotProvider } from "@/components/live-ops/company-live-ops-snapshot-context";
import { LiveLocationsFeedCard } from "@/components/live-ops/live-locations-feed-card";
import { LiveOpsSummaryCards } from "@/components/live-ops/live-ops-summary-cards";
import { PulseIcon } from "@/components/shared/app-icons";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyLiveOpsPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-line bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,0.07)]">
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#6c727b] uppercase">Canli Operasyon</p>
        <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-950">
          <span className="icon-badge h-8 w-8">
            <PulseIcon className="h-4 w-4" />
          </span>
          Operasyon merkezi
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">
          Bu ekranda canli konum, seferdeki araclar ve takip gereken durumlar tek panelde gorunur.
        </p>
      </div>

      <CompanyLiveOpsSnapshotProvider companyId={companyId} pollIntervalMs={8_000} limit={200}>
        <LiveOpsSummaryCards />
        <LiveLocationsFeedCard companyId={companyId} maxItems={12} />
      </CompanyLiveOpsSnapshotProvider>
    </section>
  );
}
