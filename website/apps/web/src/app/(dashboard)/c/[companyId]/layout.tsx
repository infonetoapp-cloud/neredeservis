import type { ReactNode } from "react";

import { CompanyActiveContextCard } from "@/components/company/company-active-context-card";
import { CompanyContextGuard } from "@/components/company/company-context-guard";
import { CompanyMembershipProvider } from "@/components/company/company-membership-context";
import { CompanySidebarNav } from "@/components/company/company-sidebar-nav";

type Props = {
  children: ReactNode;
  params: Promise<{ companyId: string }>;
};

export default async function CompanySectionLayout({ children, params }: Props) {
  const { companyId } = await params;

  return (
    <CompanyMembershipProvider companyId={companyId}>
      <div className="-mx-4 grid gap-5 sm:-mx-6 lg:grid-cols-[290px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="px-4 sm:px-6 lg:sticky lg:top-[82px] lg:h-[calc(100vh-104px)] lg:overflow-y-auto lg:pr-0">
          <div className="h-full rounded-none border border-[#0a1929] bg-[#0F2242] p-4 shadow-[0_16px_46px_rgba(10,15,30,0.30)] lg:rounded-3xl">
            <CompanyActiveContextCard />

            <CompanySidebarNav companyId={companyId} />
          </div>
        </aside>

        <div className="min-w-0 px-4 sm:px-6 lg:pl-2">
          <CompanyContextGuard key={companyId} companyId={companyId}>
            {children}
          </CompanyContextGuard>
        </div>
      </div>
    </CompanyMembershipProvider>
  );
}
