import { MapPinned } from "lucide-react";

import { CompanyRoutesManagement } from "@/components/company/company-routes-management";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyRoutesPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="ROTALAR"
        title="Rota ve durak yönetimi"
        description="Başlangıç, bitiş ve ara durakları kolayca ekleyin; kayıtlı rotaları tek ekranda düzenleyin."
        accent="violet"
        icon={<MapPinned className="h-4 w-4" />}
        compact
      />
      <CompanyRoutesManagement companyId={companyId} />
    </section>
  );
}