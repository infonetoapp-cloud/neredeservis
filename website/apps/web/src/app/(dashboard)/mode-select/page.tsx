import { ModeSelectCards } from "@/components/dashboard/mode-select-cards";

export default function ModeSelectPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-blue-700 uppercase">Faz 2</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Hangi mod ile devam etmek istiyorsun?
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Email/Google girisi sonrasi panel modunu sec. Company tarafinda firma
          uyelikleri gercek `listMyCompanies` callable uzerinden yuklenir;
          sirketin yoksa ayni ekrandan olusturabilirsin.
        </p>
      </div>

      <ModeSelectCards />

      <div className="rounded-2xl border border-dashed border-line bg-slate-50 p-4 text-sm text-muted">
        Not: Faz 2 bootstrap canli. `listMyCompanies/createCompany` ustune
        `inviteCompanyMember/acceptCompanyInvite` davet akislari acildi; sonraki adim
        pending davet onboarding detaylarini genisletmek.
      </div>
    </section>
  );
}
