import { CompanyModuleShell } from "@/components/company/company-module-shell";
import { CompanyRoutesManagement } from "@/components/company/company-routes-management";
import { RouteIcon } from "@/components/shared/app-icons";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyRoutesPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyModuleShell
      eyebrow="ROTALAR"
      title="Rota ve durak yonetimi"
      description="Baslangic, bitis ve ara duraklari kolayca ekleyin; kayitli rotalari tek ekranda duzenleyin."
      icon={<RouteIcon className="h-4 w-4" />}
      checkpoints={[
        "Rota listesi ve hizli duzenleme",
        "Baslangic/bitis secimi ve plan saati",
        "Durak ekleme, siralama ve silme",
      ]}
    >
      <CompanyRoutesManagement companyId={companyId} />
    </CompanyModuleShell>
  );
}
