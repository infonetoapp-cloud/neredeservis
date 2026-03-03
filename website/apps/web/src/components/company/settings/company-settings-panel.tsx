"use client";

import { useState } from "react";
import {
  Building2,
  Bell,
  Key,
  Webhook,
  Save,
  Upload,
} from "lucide-react";

import { useCompanyMembership } from "@/components/company/company-membership-context";

type SettingsTab = "profile" | "notifications" | "integrations";

const TABS: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: "profile", label: "Şirket Profili", icon: Building2 },
  { id: "notifications", label: "Bildirimler", icon: Bell },
  { id: "integrations", label: "Entegrasyonlar", icon: Key },
];

type Props = {
  companyId: string;
};

export function CompanySettingsPanel({ companyId }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { companyName, memberRole } = useCompanyMembership();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-slate-200 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "profile" ? (
          <ProfileTab companyName={companyName} companyId={companyId} memberRole={memberRole} />
        ) : activeTab === "notifications" ? (
          <NotificationsTab />
        ) : (
          <IntegrationsTab companyId={companyId} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile Tab                                                        */
/* ------------------------------------------------------------------ */

function ProfileTab({
  companyName,
  companyId,
  memberRole,
}: {
  companyName: string | null;
  companyId: string;
  memberRole: string | null;
}) {
  const isOwner = memberRole === "owner";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Şirket bilgileri</h3>
        <p className="mt-1 text-sm text-slate-500">Şirketinizin temel bilgilerini buradan yönetin.</p>
      </div>

      {/* Logo upload */}
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
          <Building2 className="h-6 w-6 text-slate-400" />
        </div>
        <div>
          <button
            type="button"
            disabled={!isOwner}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Logo yükle
          </button>
          <p className="mt-1 text-xs text-slate-400">PNG veya SVG, maks. 2MB</p>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField label="Şirket adı" defaultValue={companyName ?? ""} disabled={!isOwner} />
        <SettingsField label="Şirket ID" defaultValue={companyId} disabled />
        <SettingsField label="E-posta" placeholder="info@sirket.com" disabled={!isOwner} />
        <SettingsField label="Telefon" placeholder="+90 5XX XXX XX XX" disabled={!isOwner} />
        <SettingsField label="Adres" placeholder="İstanbul, Türkiye" className="sm:col-span-2" disabled={!isOwner} />
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={!isOwner}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          Değişiklikleri kaydet
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notifications Tab                                                  */
/* ------------------------------------------------------------------ */

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Bildirim tercihleri</h3>
        <p className="mt-1 text-sm text-slate-500">Operasyonel uyarıları ve bildirimleri kişiselleştirin.</p>
      </div>

      <div className="space-y-3">
        <NotificationToggle
          label="Bağlantı kopan araç uyarısı"
          description="Araç 5+ dakika sinyal göndermezse bildirim al"
          defaultOn
        />
        <NotificationToggle
          label="Geciken sefer uyarısı"
          description="Sefer planlanandan 15+ dakika geç kalırsa bildirim al"
          defaultOn
        />
        <NotificationToggle
          label="Yeni üye katılımı"
          description="Yeni bir üye şirkete katıldığında bildirim al"
          defaultOn={false}
        />
        <NotificationToggle
          label="Günlük operasyon özeti"
          description="Her gün saat 20:00'de operasyon özeti e-postası al"
          defaultOn={false}
        />
        <NotificationToggle
          label="Hız limiti aşımı"
          description="Araç belirlenen hız limitini aştığında anında bildirim al"
          defaultOn
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Integrations Tab                                                   */
/* ------------------------------------------------------------------ */

function IntegrationsTab({ companyId }: { companyId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">API ve entegrasyonlar</h3>
        <p className="mt-1 text-sm text-slate-500">Harici sistemlerle entegrasyon için API anahtarı ve webhook ayarları.</p>
      </div>

      {/* API Key section */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <Key className="h-4 w-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">API Anahtarı</div>
            <div className="mt-0.5 text-xs text-slate-500">Şirket ID: {companyId}</div>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Anahtar oluştur
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          API anahtarları henüz aktif değil. Bu özellik yakında kullanıma sunulacak.
        </p>
      </div>

      {/* Webhook section */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <Webhook className="h-4 w-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">Webhook ayarları</div>
            <div className="mt-0.5 text-xs text-slate-500">Olay tetiklemelerini harici URL&apos;lere yönlendirin</div>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Webhook ekle
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Webhook entegrasyonu henüz aktif değil. Bu özellik yakında kullanıma sunulacak.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared components                                                  */
/* ------------------------------------------------------------------ */

function SettingsField({
  label,
  defaultValue,
  placeholder,
  disabled,
  className,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  defaultOn,
}: {
  label: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn ?? false);

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="mt-0.5 text-xs text-slate-500">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          on ? "bg-emerald-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
