import { CompanyVehiclesManagement } from "@/components/company/company-vehicles-management";
import { PageHeader } from "@/components/shared/page-header";
import { Bus } from "lucide-react";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyVehiclesPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="ARAÇLAR"
        title="Araç yönetimi"
        description="Araçları tek ekrandan izleyin, filtreleyin ve gerekli bilgileri hızlı şekilde güncelleyin."
        accent="sky"
        icon={<Bus className="h-4 w-4" />}
      />
      <CompanyVehiclesManagement companyId={companyId} />
    </section>
  );
}
