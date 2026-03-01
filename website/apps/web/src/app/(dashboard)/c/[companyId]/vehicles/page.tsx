import { CompanyModuleShell } from "@/components/company/company-module-shell";
import { CompanyVehiclesManagement } from "@/components/company/company-vehicles-management";
import { CarIcon } from "@/components/shared/app-icons";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyVehiclesPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyModuleShell
      eyebrow="ARACLAR"
      title="Arac yonetimi"
      description="Araclari tek ekrandan izle, filtrele ve gerekli bilgileri hizli sekilde guncelle."
      icon={<CarIcon className="h-4 w-4" />}
      checkpoints={[
        "Durum kartlari: toplam, aktif, pasif, kapasite/etiket ozeti",
        "Hizli arama ve durum filtreleme",
        "Secili arac detay ve duzenleme paneli",
      ]}
    >
      <CompanyVehiclesManagement companyId={companyId} />
    </CompanyModuleShell>
  );
}
