import { CompanyMembersManagement } from "@/components/company/company-members-management";
import { CompanyRoleGuard } from "@/components/company/company-role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { ShieldCheck } from "lucide-react";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyMembersPage({ params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyRoleGuard companyId={companyId} requiredRoles={["owner", "admin"]}>
      <section className="space-y-5">
        <PageHeader
          eyebrow="ÜYELER"
          title="Üye ve rol yönetimi"
          description="Ekip üyelerini tek ekrandan görüntüleyin, rol değişikliklerini yönetin ve e-posta ile davet sürecini takip edin."
          accent="slate"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <CompanyMembersManagement companyId={companyId} />
      </section>
    </CompanyRoleGuard>
  );
}
