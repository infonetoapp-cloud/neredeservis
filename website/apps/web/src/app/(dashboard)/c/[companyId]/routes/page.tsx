import { CompanyRoutesManagement } from "@/components/company/company-routes-management";
import { PageHeader } from "@/components/shared/page-header";
import { MapPinned } from "lucide-react";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyRoutesPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="ROTALAR"
        title="Rota ve durak yönetimi"
        description="Başlangıç, bitiş ve ara durakları kolayca ekleyin; kayıtlı rotaları tek ekranda düzenleyin."
        accent="violet"
        icon={<MapPinned className="h-4 w-4" />}
      />
      <CompanyRoutesManagement companyId={companyId} />
    </section>
  );
}
