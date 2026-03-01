import { SelectCompanyClient } from "@/components/company/select-company-client";
import { BuildingIcon } from "@/components/shared/app-icons";

export default function SelectCompanyPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_6px_rgba(16,24,40,0.04)]">
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#6c727b] uppercase">Company Context</p>
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-950">
          <span className="icon-badge h-8 w-8">
            <BuildingIcon className="h-4 w-4" />
          </span>
          Aktif sirket baglamini sec
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Secim listesi once backend `listMyCompanies` callable cevabindan yuklenir.
          Liste bos donerse yalnizca gelistirme fallback devreye girer.
        </p>
      </div>
      <SelectCompanyClient />
    </section>
  );
}
