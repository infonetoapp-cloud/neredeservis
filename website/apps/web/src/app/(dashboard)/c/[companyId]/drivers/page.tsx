import { CompanyDriversList } from "@/components/company/company-drivers-list";
import { PageHeader } from "@/components/shared/page-header";
import { Users } from "lucide-react";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyDriversPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="ŞOFÖRLER"
        title="Şoför yönetimi"
        description="Şoför durumunu izleyin, mobil sürücü giriş hesabı oluşturun ve rota atamalarını yönetin."
        accent="rose"
        icon={<Users className="h-4 w-4" />}
      />
      <CompanyDriversList companyId={companyId} />
    </section>
  );
}
