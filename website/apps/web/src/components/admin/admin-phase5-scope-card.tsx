"use client";

type ScopeItem = {
  id: string;
  label: string;
};

const ITEMS: ScopeItem[] = [
  { id: "audit", label: "Audit read-side + denied/error triage" },
  { id: "security", label: "Security hardening checklist" },
  { id: "quality", label: "Staging smoke runbook + release gate" },
  { id: "cost", label: "Cost/budget alerts gorunurlugu" },
  { id: "cors", label: "CORS / origin allow-list doğrulama" },
  { id: "secrets", label: "Env/secret hygiene checklist" },
];

export function AdminPhase5ScopeCard() {
  return (
    <section
      id="faz5-scope"
      className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      <div className="mb-2 text-sm font-semibold text-slate-900">Faz 5 Kapsam Ozeti</div>
      <p className="text-xs text-muted">
        Pilot oncesi sertlestirme kapsaminda asagidaki alanlar dogrulanir.
      </p>
      <ul className="mt-3 space-y-2 text-xs text-slate-800">
        {ITEMS.map((item) => (
          <li key={item.id} className="rounded-xl border border-line bg-white px-3 py-2">
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

