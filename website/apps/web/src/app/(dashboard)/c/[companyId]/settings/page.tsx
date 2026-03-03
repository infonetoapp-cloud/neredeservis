import { CompanyModuleShell } from "@/components/company/company-module-shell";
import { CompanySettingsPanel } from "@/components/company/settings/company-settings-panel";
import { CompanyRoleGuard } from "@/components/company/company-role-guard";
import { SettingsIcon } from "@/components/shared/app-icons";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanySettingsPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyRoleGuard companyId={companyId} requiredRoles={["owner", "admin"]}>
      <CompanyModuleShell
        eyebrow="AYARLAR"
        title="Şirket ayarları"
        description="Şirket profilini düzenleyin, bildirim tercihlerini yönetin ve entegrasyon ayarlarını yapılandırın."
        icon={<SettingsIcon className="h-4 w-4" />}
        checkpoints={[
          "Şirket profili: ad, logo ve iletişim bilgileri",
          "Bildirim tercihleri ve uyarı eşikleri",
          "API anahtarları ve webhook entegrasyonları",
        ]}
      >
        <CompanySettingsPanel companyId={companyId} />
      </CompanyModuleShell>
    </CompanyRoleGuard>
  );
}
