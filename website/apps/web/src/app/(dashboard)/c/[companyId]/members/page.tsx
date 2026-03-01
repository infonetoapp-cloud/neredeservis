import { CompanyModuleShell } from "@/components/company/company-module-shell";
import { CompanyMembersManagement } from "@/components/company/company-members-management";
import { CompanyRoleGuard } from "@/components/company/company-role-guard";
import { ShieldLockIcon } from "@/components/shared/app-icons";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyMembersPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyRoleGuard companyId={companyId} requiredRoles={["owner", "admin"]}>
      <CompanyModuleShell
        eyebrow="UYELER"
        title="Uye ve rol yonetimi"
        description="Ekip uyelerini tek ekrandan gor, rol degisikliklerini yonet ve e-posta ile davet surecini takip et."
        icon={<ShieldLockIcon className="h-4 w-4" />}
        checkpoints={[
          "Durum kartlari: uye, rol ve davet ozeti",
          "Filtreli uye listesi ve detay paneli",
          "Davet olusturma ve bekleyen davet yonetimi",
        ]}
      >
        <CompanyMembersManagement companyId={companyId} />
      </CompanyModuleShell>
    </CompanyRoleGuard>
  );
}
