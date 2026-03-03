import { ModeSelectCards } from "@/components/dashboard/mode-select-cards";

export default function ModeSelectPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Firma Secimi
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Mevcut firma uyeliklerinden birini sec veya yeni firma olustur.
          Davet bekleyen uyelikleri de buradan kabul edebilirsin.
        </p>
      </div>

      <ModeSelectCards />
    </section>
  );
}
