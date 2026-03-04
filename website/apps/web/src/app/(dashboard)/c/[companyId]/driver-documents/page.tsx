import { PageHeader } from "@/components/shared/page-header";
import { CompanyDriverDocumentsManagement } from "@/components/company/company-driver-documents-management";
import { FileText } from "lucide-react";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function DriverDocumentsPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="ŞOFÖR BELGELER"
        title="Belge yönetimi"
        description="Ehliyet, SRC, psikoteknik ve sağlık raporu durumlarını takip edin. Süresi dolan belgeler otomatik uyarı verir."
        accent="orange"
        icon={<FileText className="h-4 w-4" />}
      />

      <CompanyDriverDocumentsManagement companyId={companyId} />
    </section>
  );
}
