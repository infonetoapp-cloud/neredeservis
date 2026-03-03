import type { ReactNode } from "react";

import { CompanyContextGuard } from "@/components/company/company-context-guard";
import { CompanyMembershipProvider } from "@/components/company/company-membership-context";

type Props = {
  children: ReactNode;
  params: Promise<{ companyId: string }>;
};

export default async function CompanySectionLayout({ children, params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyMembershipProvider companyId={companyId}>
      <CompanyContextGuard key={companyId} companyId={companyId}>
        {children}
      </CompanyContextGuard>
    </CompanyMembershipProvider>
  );
}
