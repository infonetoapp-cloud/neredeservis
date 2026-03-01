import { CompanyDashboardOverview } from "@/components/company/dashboard/company-dashboard-overview";
import { CompanyDashboardHero } from "@/components/company/dashboard/company-dashboard-hero";
import { CompanyLiveOpsSnapshotProvider } from "@/components/live-ops/company-live-ops-snapshot-context";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyDashboardPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-6">
      <CompanyDashboardHero />

      <CompanyLiveOpsSnapshotProvider companyId={companyId} pollIntervalMs={12_000} limit={200}>
        <CompanyDashboardOverview companyId={companyId} />
      </CompanyLiveOpsSnapshotProvider>
    </section>
  );
}
