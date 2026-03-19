import { Radio } from "lucide-react";

import { CompanyLiveOpsSnapshotProvider } from "@/components/live-ops/company-live-ops-snapshot-context";
import { LiveLocationsFeedCard } from "@/components/live-ops/live-locations-feed-card";
import { LiveOpsSummaryCards } from "@/components/live-ops/live-ops-summary-cards";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyLiveOpsPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="CANLI OPERASYON"
        title="Operasyon merkezi"
        description="Canlı konum, seferdeki araçlar ve takip gereken durumlar tek panelde görünür."
        accent="emerald"
        icon={<Radio className="h-4 w-4" />}
        compact
      />

      <CompanyLiveOpsSnapshotProvider companyId={companyId} pollIntervalMs={8_000} limit={200}>
        <LiveOpsSummaryCards />
        <LiveLocationsFeedCard companyId={companyId} maxItems={12} />
      </CompanyLiveOpsSnapshotProvider>
    </section>
  );
}