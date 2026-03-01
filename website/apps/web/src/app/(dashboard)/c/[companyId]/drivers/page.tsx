import { CompanyModuleShell } from "@/components/company/company-module-shell";
import { CompanyDriversList } from "@/components/company/company-drivers-list";
import { UsersIcon } from "@/components/shared/app-icons";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyDriversPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyModuleShell
      eyebrow="SOFORLER"
      title="Sofor yonetimi"
      description="Sofor durumunu izle, mobil surucu giris hesabi olustur ve rota atamalarini bu ekrandan yonet."
      icon={<UsersIcon className="h-4 w-4" />}
      checkpoints={[
        "Durum kartlari: toplam, aktif, pasif, atama bekleyen",
        "Sadece mobil giris hesabi olusturma + kopyalanabilir bilgiler",
        "Hizli filtre ve arama",
        "Rota atama ve atama kaldirma aksiyonlari",
      ]}
    >
      <CompanyDriversList companyId={companyId} />
    </CompanyModuleShell>
  );
}
