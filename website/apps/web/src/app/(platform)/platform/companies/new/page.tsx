"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { platformCreateCompany } from "@/features/platform/platform-callables";

export default function PlatformCreateCompanyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [vehicleLimit, setVehicleLimit] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const isValid = companyName.trim().length >= 2 && ownerEmail.includes("@") && vehicleLimit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await platformCreateCompany({
        companyName: companyName.trim(),
        ownerEmail: ownerEmail.trim(),
        vehicleLimit,
      });

      if (result.passwordResetLink) {
        setResetLink(result.passwordResetLink);
      } else {
        router.push("/platform/companies");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata olustu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (resetLink) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-800">Sirket Basariyla Olusturuldu</h2>
          <p className="mt-2 text-sm text-emerald-700">
            <strong>{companyName}</strong> icin sirket kaydi olusturuldu.
            Asagidaki sifre belirleme linkini yetkili kisiye iletin:
          </p>
          <div className="mt-3 rounded-xl border border-emerald-300 bg-white p-3">
            <code className="block break-all text-xs text-slate-700">{resetLink}</code>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => void navigator.clipboard.writeText(resetLink)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Linki Kopyala
            </button>
            <Link
              href="/platform/companies"
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
            >
              Sirketlere Don
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/platform/companies"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Sirketlere Don
      </Link>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Yeni Sirket Olustur</h2>
        <p className="mt-1 text-sm text-muted">
          Sirket adi ve yetkili e-posta adresi girin. Yetkili kisi Firebase davet e-postasi
          alacak ve kendi sifresini belirleyecektir.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">
              Sirket Adi
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ornek: Atlas Servis A.S."
              className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              required
              minLength={2}
            />
          </div>

          {/* Owner Email */}
          <div>
            <label htmlFor="ownerEmail" className="block text-sm font-medium text-slate-700">
              Yetkili E-posta
            </label>
            <input
              id="ownerEmail"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="yetkili@firma.com"
              className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              required
            />
            <p className="mt-1.5 text-xs text-muted">
              Bu adrese Firebase davet e-postasi gonderilecek.
            </p>
          </div>

          {/* Vehicle Limit */}
          <div>
            <label htmlFor="vehicleLimit" className="block text-sm font-medium text-slate-700">
              Arac Limiti
            </label>
            <input
              id="vehicleLimit"
              type="number"
              value={vehicleLimit}
              onChange={(e) => setVehicleLimit(Number(e.target.value))}
              min={1}
              max={999}
              className="mt-1 block w-24 rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              required
            />
            <p className="mt-1.5 text-xs text-muted">
              Sirketin tanimlayabilecegi maksimum arac sayisi.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? "Olusturuluyor..." : "Sirket Olustur"}
            </button>
            <Link
              href="/platform/companies"
              className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
            >
              Iptal
            </Link>
          </div>
        </form>
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <h3 className="text-sm font-semibold text-indigo-800">Davet Akisi</h3>
        <ol className="mt-2 space-y-1.5 text-xs leading-5 text-indigo-700">
          <li>1. Sirket adi ve yetkili e-posta giriyorsunuz.</li>
          <li>2. Sistem Firestore&apos;da sirket kaydini olusturur.</li>
          <li>3. Yetkili kisiye Firebase Auth davet e-postasi gider.</li>
          <li>4. Yetkili kisi linke tiklayip sifresini belirler.</li>
          <li>5. Otomatik olarak sirketin &quot;owner&quot; uyesi olur.</li>
        </ol>
      </div>
    </div>
  );
}
