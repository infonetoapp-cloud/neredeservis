import { CompanySettingsPanel } from "@/components/company/settings/company-settings-panel";
import { CompanyRoleGuard } from "@/components/company/company-role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { Settings } from "lucide-react";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanySettingsPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyRoleGuard companyId={companyId} requiredRoles={["owner", "admin"]}>
      <section className="space-y-5">
        <PageHeader
          eyebrow="AYARLAR"
          title="Şirket ayarları"
          description="Şirket profilini düzenleyin, bildirim tercihlerini yönetin ve entegrasyon ayarlarını yapılandırın."
          accent="orange"
          icon={<Settings className="h-4 w-4" />}
        />
        <CompanySettingsPanel companyId={companyId} />
      </section>
    </CompanyRoleGuard>
  );
}
