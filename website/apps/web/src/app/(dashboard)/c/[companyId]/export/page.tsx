import { PageHeader } from "@/components/shared/page-header";
import { CompanyExportPanel } from "@/components/company/export/company-export-panel";
import { Download } from "lucide-react";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function ExportPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="DIŞA AKTARMA"
        title="Raporlar & Dışa Aktarma"
        description="Araç, rota, şoför ve üye verilerinizi CSV formatında indirin."
        accent="teal"
        icon={<Download className="h-4 w-4" />}
      />

      <CompanyExportPanel companyId={companyId} />
    </section>
  );
}
